// backend/service/ai/groqClient.js
import axios from "axios";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/** Thin, typed-in-spirit wrapper around Groq's OpenAI-compatible chat completions endpoint.
 * Kept as the single choke point for the LLM call so retries/timeouts/error-shaping live in one
 * place — every other AI module talks to this, never to axios/Groq directly. */

export class AIServiceError extends Error {
  constructor(message, { code, retryable = false, status } = {}) {
    super(message);
    this.name = "AIServiceError";
    this.code = code || "AI_ERROR";
    this.retryable = retryable;
    this.status = status;
  }
}

/**
 * @param {{role: "system"|"user"|"assistant", content: string}[]} messages
 * @param {{model?: string, temperature?: number, maxTokens?: number, timeoutMs?: number}} opts
 * @returns {Promise<string>} the assistant's reply text
 */
export async function callGroq(messages, opts = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AIServiceError(
      "The AI assistant isn't configured yet — GROQ_API_KEY is missing.",
      { code: "NOT_CONFIGURED" }
    );
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.3,
    maxTokens = 1024,
    timeoutMs = 30000,
  } = opts;

  try {
    const { data } = await axios.post(
      GROQ_URL,
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: timeoutMs,
      }
    );

    const text = data?.choices?.[0]?.message?.content;
    if (!text || !text.trim()) {
      throw new AIServiceError("The AI assistant returned an empty response.", {
        code: "EMPTY_RESPONSE",
        retryable: true,
      });
    }
    return text.trim();
  } catch (err) {
    if (err instanceof AIServiceError) throw err;

    const status = err.response?.status;
    if (status === 401 || status === 403) {
      console.error("[groqClient] Auth error:", err.response?.data);
      throw new AIServiceError("The AI assistant is misconfigured. Please contact support.", {
        code: "AUTH_ERROR",
        status,
      });
    }
    if (status === 429) {
      console.error("[groqClient] Rate limited:", err.response?.data);
      throw new AIServiceError("The AI assistant is receiving too many requests right now. Please try again shortly.", {
        code: "RATE_LIMITED",
        retryable: true,
        status,
      });
    }
    if (status >= 400 && status < 500) {
      console.error("[groqClient] Bad request:", err.response?.data);
      throw new AIServiceError("The AI assistant couldn't process that request.", {
        code: "BAD_REQUEST",
        status,
      });
    }
    if (err.code === "ECONNABORTED") {
      console.error("[groqClient] Timeout after", timeoutMs, "ms");
      throw new AIServiceError("The AI assistant took too long to respond. Please try again.", {
        code: "TIMEOUT",
        retryable: true,
      });
    }

    console.error("[groqClient] Unexpected error:", err.message);
    throw new AIServiceError("The AI assistant is temporarily unavailable. Please try again in a moment.", {
      code: "UNKNOWN",
      retryable: true,
      status,
    });
  }
}
