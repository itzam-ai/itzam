import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";

export async function transcribeAudioFromUrl(
  audioUrl: string,
  openaiKey: string
): Promise<string> {
  const openaiProvider = openai({ apiKey: openaiKey });

  // Fetch audio from URL
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();

  // Transcribe using AI SDK
  const result = await transcribe({
    model: openaiProvider.transcription("whisper-1"),
    audio: new Uint8Array(audioBuffer),
  });

  return result.text;
}