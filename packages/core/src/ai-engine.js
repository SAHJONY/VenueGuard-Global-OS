import { BrainProvider, routeBrainTask } from "./brain.js";

function outputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  if (Array.isArray(payload.content)) return payload.content.filter(item => item.type === "text").map(item => item.text).join("\n");
  return payload.output?.flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text).join("\n") || "";
}

async function requestJson(fetcher, url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`MODEL_HTTP_${response.status}`);
    return response.json();
  } finally { clearTimeout(timer); }
}

async function callProvider(route, prompt, environment, fetcher, timeoutMs) {
  if (route.provider === BrainProvider.OPENAI) {
    const payload = await requestJson(fetcher, "https://api.openai.com/v1/responses", {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${environment.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: route.model, input: prompt, store: false })
    }, timeoutMs);
    return { text: outputText(payload), requestId: payload.id || null };
  }
  const payload = await requestJson(fetcher, "https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "content-type": "application/json", "x-api-key": environment.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: route.model, max_tokens: 4096, messages: [{ role: "user", content: prompt }] })
  }, timeoutMs);
  return { text: outputText(payload), requestId: payload.id || null };
}

export async function runBrain({ task, prompt, environment = {}, fetcher = globalThis.fetch, timeoutMs = 30000 }) {
  if (!prompt?.trim()) throw new Error("PROMPT_REQUIRED");
  if (typeof fetcher !== "function") throw new Error("FETCH_REQUIRED");
  const route = routeBrainTask(task, environment);
  const startedAt = Date.now();
  try {
    const result = await callProvider(route, prompt, environment, fetcher, timeoutMs);
    return Object.freeze({ ...result, provider: route.provider, model: route.model, failedOver: false, durationMs: Date.now() - startedAt });
  } catch (primaryError) {
    if (!route.failover) throw primaryError;
    const result = await callProvider(route.failover, prompt, environment, fetcher, timeoutMs);
    return Object.freeze({ ...result, provider: route.failover.provider, model: route.failover.model, failedOver: true, durationMs: Date.now() - startedAt });
  }
}
