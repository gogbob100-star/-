export interface AIAssistRequest {
  action:
    | 'continue_scene'
    | 'brainstorm_ideas'
    | 'develop_character'
    | 'generate_character_names'
    | 'proofread_text'
    | 'enhance_prose'
    | 'critique_chapter'
    | 'generate_dialogue'
    | 'custom_prompt';
  context: {
    novelTitle?: string;
    genre?: string;
    summary?: string;
    chapterTitle?: string;
    chapterContent?: string;
    selectedText?: string;
    characters?: Array<{ name: string; role: string; description?: string }>;
    tone?: string;
    pov?: string;
    era?: string;
    culture?: string;
    gender?: string;
    nameVibe?: string;
    instructions?: string;
  };
}

export interface AIAssistOptions {
  maxRetries?: number;
  onRetry?: (attempt: number, maxRetries: number, message: string) => void;
}

export async function requestAIAssist(
  payload: AIAssistRequest,
  options?: AIAssistOptions
): Promise<string> {
  const maxRetries = options?.maxRetries ?? 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/ai/novel-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = 'تعذر الاتصال بالمساعد الذكي.';
        const is503OrOverloaded =
          response.status === 503 ||
          response.status === 429 ||
          response.status === 502 ||
          response.status === 504;

        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch {
          // fallback
        }

        // If it's a 503 / 429 or server busy and we still have retry attempts remaining
        if (is503OrOverloaded && attempt < maxRetries) {
          const delayMs = attempt * 2000; // Exponential backoff: 2s, 4s...
          if (options?.onRetry) {
            options.onRetry(
              attempt + 1,
              maxRetries,
              'الخادم مشغول حالياً، جاري إعادة المحاولة تلقائياً...'
            );
          }
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      return data.result || '';
    } catch (err: any) {
      lastError = err;
      const msg = (err?.message || '').toLowerCase();
      const isRetryable =
        msg.includes('503') ||
        msg.includes('busy') ||
        msg.includes('مشغول') ||
        msg.includes('failed to fetch') ||
        msg.includes('network');

      if (isRetryable && attempt < maxRetries) {
        const delayMs = attempt * 2000;
        if (options?.onRetry) {
          options.onRetry(
            attempt + 1,
            maxRetries,
            'الخادم مشغول حالياً، جاري إعادة المحاولة تلقائياً...'
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      throw err;
    }
  }

  throw (
    lastError ||
    new Error('الخادم مشغول حالياً، تعذر إكمال الطلب بعد 3 محاولات. يرجى المحاولة بعد قليل.')
  );
}

export interface GenerateCoverParams {
  prompt: string;
  style?: string;
  title?: string;
}

export async function generateNovelCover(params: GenerateCoverParams): Promise<string> {
  const response = await fetch('/api/generate-cover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMsg = 'تعذر توليد غلاف الرواية.';
    try {
      const errData = await response.json();
      if (errData.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  if (!data.imageUrl) {
    throw new Error('لم يتم استلام رابط الصورة من الخادم.');
  }

  return data.imageUrl;
}
