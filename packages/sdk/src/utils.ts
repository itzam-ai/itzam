import type { StreamEvent } from "@itzam/api/client/index.d";

type StreamMetadata = {
	runId: string;
	model: {
		name: string;
		tag: string;
	};
	inputTokens: number;
	outputTokens: number;
	durationInMs: number;
	cost: string;
};

export type EventHandler<T extends StreamEvent["type"]> = {
	type: T;
	handler: (data: Extract<StreamEvent, { type: T }>) => unknown;
};

export async function* createEventStream<T extends StreamEvent["type"]>(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	eventHandlers: EventHandler<T>[],
	onMetadata?: (metadata: StreamMetadata) => void,
): AsyncGenerator<T, void, unknown> {
	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]?.trim();

			if (!line) {
				continue;
			}

			if (line.startsWith("event: ")) {
				const eventType = line.slice(7);
				const data = lines[++i]?.slice(6);
				if (!data) {
					continue;
				}

				const parsedData = JSON.parse(data);

				if (eventType === "error") {
					throw new Error(parsedData);
				}

				if (eventType === "finish" && onMetadata) {
					onMetadata(parsedData.metadata);
					continue;
				}

				const handler = eventHandlers.find((h) => h.type === eventType);
				if (handler) {
					const result = await handler.handler(parsedData);
					yield result as T;
				}
			}
		}
	}
}
