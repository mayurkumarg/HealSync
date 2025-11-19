// backend/controllers/helpers/llmHelper.js
import axios from "axios";

export async function callOllama(prompt, model = process.env.OLLAMA_MODEL || "llama3.1") {
  try {
    const url = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
    const payload = { model, prompt, stream: false, temperature: 0.0, max_tokens: 1024 };
    const r = await axios.post(url, payload, { timeout: 120000 });
    // Ollama returns structured response in r.data; adapt if your Ollama version differs
    return r.data?.response || r.data || "";
  } catch (err) {
    console.error("LLM helper error:", err?.message || err);
    return "";
  }
}
