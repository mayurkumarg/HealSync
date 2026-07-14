// backend/controllers/helpers/llmHelper.js
import axios from "axios";

export async function callOllama(prompt, model = process.env.OLLAMA_MODEL || "llama3.1") {
  try {
    const url = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
    
    console.log("\n[LLM] Calling Ollama...");
    console.log("[LLM] URL:", url);
    console.log("[LLM] Model:", model);
    console.log("[LLM] Prompt length:", prompt.length, "characters");
    
    const payload = { 
      model, 
      prompt, 
      stream: false, 
      options: {
        temperature: 0.7,
        num_predict: 512,  // Reduced from 1024 for faster responses
        num_ctx: 2048,     // Context window size
        top_k: 40,
        top_p: 0.9,
      }
    };
    
    const startTime = Date.now();
    // Increased timeout to 180 seconds for large model
    const r = await axios.post(url, payload, { timeout: 180000 });
    const duration = Date.now() - startTime;
    
    console.log("[LLM] Response received in", duration, "ms (", (duration/1000).toFixed(1), "seconds )");
    console.log("[LLM] Response data keys:", Object.keys(r.data));
    
    // Ollama returns structured response in r.data
    const response = r.data?.response || r.data || "";
    
    if (!response) {
      console.error("[LLM] WARNING: Empty response from Ollama");
      console.error("[LLM] Full response:", JSON.stringify(r.data, null, 2));
    } else {
      console.log("[LLM] Response length:", response.length, "characters");
    }
    
    return response;
  } catch (err) {
    console.error("\n[LLM] ERROR Details:");
    console.error("[LLM] Error message:", err?.message);
    console.error("[LLM] Error code:", err?.code);
    console.error("[LLM] Is timeout?", err?.message?.includes("timeout"));
    
    if (err?.code === "ECONNREFUSED") {
      console.error("[LLM] ❌ Cannot connect to Ollama service!");
      console.error("[LLM] Make sure Ollama is running: ollama serve");
    }
    
    if (err?.message?.includes("timeout")) {
      console.error("[LLM] ⏱️  Request timed out after 180 seconds");
      console.error("[LLM] The model is taking too long. Try:");
      console.error("[LLM]   1. Reduce context/prompt size");
      console.error("[LLM]   2. Use a smaller model: ollama pull llama3.2:1b");
      console.error("[LLM]   3. Ensure system has enough RAM (llama3.1 needs ~8GB)");
    }
    
    return "";
  }
}
