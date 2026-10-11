import 'dotenv/config';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
    ...options,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Ollama request failed with status ${res.status}: ${text.slice(0, 500)}`);
  }
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text };
  }
}

async function listModels() {
  try {
    const result = await fetchJson(`${OLLAMA_BASE_URL}/api/tags`);
    return Array.isArray(result.models) ? result.models.map((model) => model.name) : [];
  } catch (error) {
    return [];
  }
}

async function testConnection() {
  try {
    const result = await fetchJson(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' });
    if (!result || !Array.isArray(result.models)) {
      return {
        ok: false,
        message: 'Ollama is not reachable or is not responding. Please confirm the server is running on the configured URL.',
      };
    }

    return {
      ok: true,
      message: 'Connected to Ollama successfully.',
      models: result.models.map((model) => model.name),
    };
  } catch (error) {
    return {
      ok: false,
      message: 'Ollama connection failed. Start Ollama locally and ensure the URL is valid.',
    };
  }
}

async function resolveModel(modelName) {
  const availableModels = await listModels();
  if (!availableModels.length) {
    return modelName || DEFAULT_OLLAMA_MODEL;
  }

  const selected = modelName && availableModels.includes(modelName)
    ? modelName
    : availableModels.includes(DEFAULT_OLLAMA_MODEL)
      ? DEFAULT_OLLAMA_MODEL
      : availableModels[0];

  return selected;
}

async function generateText({
  agent,
  prompt,
  model = DEFAULT_OLLAMA_MODEL,
  temperature = 0.7,
  maxTokens = 500,
}) {
  const selectedModel = await resolveModel(model);
  const requestBody = {
    model: selectedModel,
    prompt,
    stream: false,
    options: {
      temperature,
      num_predict: maxTokens,
    },
    system: `You are the ${agent} for an AI marketing agency. Provide practical, realistic marketing recommendations. Clarify when data is insufficient and never claim external platform publishing without a real integration.`,
  };

  try {
    const result = await fetchJson(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!result || !result.response) {
      return {
        ok: false,
        message: 'The selected Ollama model did not return a usable response. Try another model or verify that Ollama is running.',
      };
    }

    return {
      ok: true,
      text: result.response,
      model: selectedModel,
    };
  } catch (error) {
    return {
      ok: false,
      message: 'Unable to generate content from Ollama. Check the Ollama server and model selection.',
    };
  }
}

export { OLLAMA_BASE_URL, listModels, testConnection, generateText };
