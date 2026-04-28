// ============================================================
// MINDSHIFT AI — AI CHAT LAYER
// Uses VITE_BUILT_IN_FORGE_API_KEY + VITE_BUILT_IN_FORGE_API_URL
// These are the working Manus Forge credentials.
// ============================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const API_URL  = import.meta.env.VITE_BUILT_IN_FORGE_API_URL  ?? 'https://forge.manus.ai';
const API_KEY  = import.meta.env.VITE_BUILT_IN_FORGE_API_KEY  ?? '';
const MODEL    = 'gpt-4.1-mini';

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text();
      onError(`API error ${res.status}: ${text.slice(0, 200)}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) { onError('No response body'); return; }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
        } catch {}
      }
    }
    onDone();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return;
    onError(String(err));
  }
}

export async function singleChat(
  messages: ChatMessage[],
): Promise<string> {
  const res = await fetch(`${API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 512,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
