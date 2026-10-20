
import OpenAI from "openai";
import { env } from "../config/env.js";

if (!env.openaiApiKey) {
  console.warn(
    "OPENAI_API_KEY is missing. AI endpoints will not work until it is configured.",
  );
}

export const openai = new OpenAI({
  apiKey: env.openaiApiKey || "missing-api-key",
});
