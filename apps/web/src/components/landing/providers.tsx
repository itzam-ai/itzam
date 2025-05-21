import Anthropic from "public/landing/anthropic";
import DeepSeek from "public/landing/deepseek";
import Google from "public/landing/google";
import MistralAI from "public/landing/mistral";
import OpenAI from "public/landing/open-ai";
import Grok from "public/landing/xai";

export function Providers() {
  return (
    <section className="pt-20 pb-6">
      <div className="container mx-auto text-center">
        <h2 className="mb-4 font-semibold text-lg text-muted-foreground">
          Featuring models from
        </h2>
        <div className="mx-auto grid grid-cols-2 items-center justify-items-center gap-4 px-6 md:grid-cols-6">
          <DeepSeek />
          <Google />
          <OpenAI />
          <Anthropic />
          <Grok />
          <MistralAI />
        </div>
      </div>
    </section>
  );
}
