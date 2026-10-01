import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Google GenAI initialization with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface NovelAssistPayload {
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

// AI Novelist Assistant Endpoint
app.post('/api/ai/novel-assist', async (req, res) => {
  try {
    const { action, context }: NovelAssistPayload = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    const charactersSummary = context?.characters?.length
      ? context.characters.map((c) => `- ${c.name} (${c.role}): ${c.description || 'لا يوجد وصف إضافي'}`).join('\n')
      : 'لم يتم تحديد شخصيات بعد.';

    let systemInstruction = `أنت روائي ومحرر أدبي محترف وكاتب خبير في السرد الروائي واللغة العربية الفصحى الراقية.
مهمتك مساعدة الكاتب والروائي في تأليف وصياغة روايته بأعلى معايير الأدب والإبداع السردي.
التزم دائماً بالأسلوب الأدبي البليغ، العمق النفسي للشخصيات، وقواعد الحوار، وبناء المشاهد الحسية الدقيقة دون ابتذال أو عبارات كليشيه مكررة.`;

    let userPrompt = '';

    switch (action) {
      case 'continue_scene':
        userPrompt = `عنوان الرواية: "${context.novelTitle || 'غير معنونة'}" (${context.genre || 'دراما عامة'})
عنوان الفصل الحالي: "${context.chapterTitle || 'فصل'}"
زاوية السرد (وجهة النظر): ${context.pov || 'راوٍ عليم (ضمير الغائب)'}
النبرة والجو العام: ${context.tone || 'أدبي عميق ومؤثر'}

الشخصيات الأساسية المتوفرة:
${charactersSummary}

ملخص الرواية:
${context.summary || 'غير متوفر'}

نص الفصل الحالي حتى الآن:
"""
${context.chapterContent ? context.chapterContent.slice(-2500) : 'بداية المشهد'}
"""

المطلوب:
اكتب إكمالاً سردياً للمشهد من حيث توقف النص.
تعليمات خاصة إضافية من الكاتب: ${context.instructions || 'أكمل السرد بتسلسل طبيعي، وأبرز المشاعر الداخلية وتفاصيل البيئة المحيطة والحوار إن لزم.'}

قدم الإكمال بأسلوب فني رفيع (بين 250 و 450 كلمة). يمكنك تقديم 2 خيارات مختلفة إذا رغبت، أو سرد متماسك ينساب مباشرة بعد النص المكتوب.`;
        break;

      case 'brainstorm_ideas':
        userPrompt = `عنوان الرواية: "${context.novelTitle || 'غير معنونة'}"
النوع الأدبي: ${context.genre || 'عام'}
ملخص الرواية: ${context.summary || 'غير متوفر'}
الفصل الحالي: ${context.chapterTitle || ''}
محتوى الفصل حتى الآن:
${context.chapterContent ? context.chapterContent.slice(-1500) : ''}

طلب الكاتب للحبكة والعصف الذهني: ${context.instructions || 'اقترح 3 انعطافات درامية مفاجئة ومقنعة (Plot Twists) أو أزمات غير متوقعة تثري الأحداث.'}

المطلوب:
قدّم اقتراحات سردية ذكية ومبتكرة تشعل مخيلة الكاتب، مع شرح تأثير كل اقتراح على مصائر الشخصيات والتوتر الدرامي.`;
        break;

      case 'develop_character':
        userPrompt = `أريد بناء وتطوير ملف شخصية روائية عميقة.
الرواية: "${context.novelTitle || ''}" (${context.genre || ''})
تفاصيل أو فكرة مبدئية من الكاتب:
${context.instructions || 'شخصية رئيسية معقدة لديها صراع داخلي وسر قديم'}

الشخصيات الأخرى في الرواية:
${charactersSummary}

المطلوب:
صمم بطاقة شخصية متكاملة تشمل:
1. الاسم والعمر والمظهر المميز (تفصيلة بصرية فريدة).
2. الدور السردي (البطل، الخصم، الحليف، إلخ).
3. الهدف الخارجي (ماذا يريد في العالم الحقيقي؟).
4. الرغبة الداخلية / الجرح القديم (ماذا يحتاج نفسياً؟).
5. نقطة الضعف القاتلة أو العيب السري.
6. نبرة الصوت وطريقة الكلام (علامة لفظية أو أسلوب حوار).
7. علاقتها بالشخصيات الأخرى وكيف تتطور في القوس الدرامي.`;
        break;

      case 'enhance_prose':
        userPrompt = `الرواية: "${context.novelTitle || ''}"
النص المراد تحسينه وإثراؤه:
"""
${context.selectedText || context.chapterContent?.slice(-1000) || ''}
"""

تعليمات الكاتب: ${context.instructions || 'أعد صياغة هذا المقطع بتقنية (Show, Don\'t Tell)، وأثره بالصور الحسية (الأصوات، الروائح، الظلال، المشاعر الدقيقة) مع الحفاظ على المعنى الأصلي.'}

المطلوب:
1. النسخة المحسنة الأدبية المصاغة بإتقان.
2. ملاحظة موجزة تشرح الفروق الجمالية المضافة.`;
        break;

      case 'critique_chapter':
        userPrompt = `أنت الآن المحرر الأدبي البارع للرواية "${context.novelTitle || ''}".
الفصل: "${context.chapterTitle || ''}"
نص الفصل:
"""
${context.chapterContent || 'لا يوجد نص بعد'}
"""

المطلوب مراجعة نقدية تحليلية بناءة تتناول:
1. إيقاع السرد (Pacing): هل هناك تمطيط أو تسارع زائد؟
2. التوتر والجاذبية: هل يشعر القارئ برغبة في معرفة التالي؟
3. بناء المشهد والشخصيات: هل كان الحوار طبيعياً ومعبراً؟
4. أبرز نقاط القوة في الفصل.
5. مقترحات محددة لتعديل أو تقوية المشاهد الضعيفة.`;
        break;

      case 'generate_dialogue':
        userPrompt = `اكتب مشهد حوار روائي مشحون وذكي بين الشخصيات.
الرواية: "${context.novelTitle || ''}"
الشخصيات:
${charactersSummary}

سياق الحوار وتعليمات الكاتب:
${context.instructions || 'حوار يكتشف فيه أحدهما حقيقة مخفية دون تصريح مباشر، مع وجود توتر باطن (Subtext)'}

نهاية النص السابق:
"""
${context.chapterContent ? context.chapterContent.slice(-800) : ''}
"""

المطلوب:
حوار نابض بالحياة، يتخلله وصف لحركات الجسد ونبرات الصوت الصامتة والنظرات، يعبر عن الباطن غير المنطوق.`;
        break;

      case 'generate_character_names':
        userPrompt = `أنت باحث خبير في أنثروبولوجيا الأسماء وتاريخ الرواية والأدب العالمي والعربي.
المطلوب توليد قائمة بـ 8 أسماء شخصيات روائية ملهمة ومتقنة تلائم المعايير التالية:
- عنوان الرواية: "${context.novelTitle || ''}"
- التصنيف الأدبي للرواية: "${context.genre || ''}"
- الحقبة الزمنية: "${context.era || 'الأندلس والعصر الذهبي الإسلامي'}"
- الثقافة / البيئة الجغرافية: "${context.culture || 'عربية أندلسية'}"
- جنس الشخصيات: "${context.gender || 'متنوع'}"
- طابع ونبرة الاسم: "${context.nameVibe || 'نبيل وذو هيبة'}"
- توجيهات إضافية من الروائي: ${context.instructions || 'قدم أسماء ثلاثية أو متبوعة بكنية أو لقب مهني وتاريخي مقنع'}

الشخصيات الحالية لتجنب التكرار:
${charactersSummary}

أعد المخرجات بصيغة JSON حصراً، كقائمة تحتوي على العناصر التالية لكل اسم:
[
  {
    "name": "الاسم الكامل (مع الكنية أو اللقب)",
    "gender": "ذكر أو أنثى",
    "meaning": "شرح دلالة الاسم التاريخية أو اللغوية",
    "vibe": "طابع الاسم (مثال: نبيل، غامض، شعبي، حاد)",
    "suggestedRole": "اقتراح الدور السردي أو المهنة الأنسب له"
  }
]`;
        break;

      case 'proofread_text':
        userPrompt = `أنت مدقق لغوي ونحوي وإملائي محترف وخبير في اللغة العربية الفصحى وأسلوب السرد الروائي الأدبي.
افحص النص السردي التالي بعناية فائقة واستخرج الأخطاء الإملائية، النحوية، علامات الترقيم، والتحسينات البلاغية والأسلوبية.

نص الفصل المراد تدقيقه:
"""
${context.selectedText || context.chapterContent || ''}
"""

معايير التدقيق:
1. الإملاء: همزات الوصل والقطع، التاء المربوطة والمفتوحة والهاء، الألف المقصورة والممدودة، تنوين النصب.
2. النحو: مطابقة الفعل للفاعل، ضبط المبتدأ والخبر، توافق العدد والمعدود، وحروف الجر والإضافة.
3. الترقيم: مواضع الفواصل، النقط، علامات الاستفهام والتعجب، وأقواس الحوار.
4. الأسلوب: تصحيح التراكيب الركيكة أو المترجمة حرفياً إلى صياغة أدبية عربية فصيحة.

أعد الرد بصيغة JSON حصراً على شكل مصفوفة تحوي الاقتراحات:
[
  {
    "original": "الكلمة أو العبارة من النص الأصلي بالضبط",
    "replacement": "التصحيح المقترح الدقيق",
    "type": "إملائي" أو "نحوي" أو "ترقيم" أو "أسلوبي",
    "explanation": "شرح موجز للقاعدة اللغوية أو سبب التصحيح"
  }
]
إذا كان النص سليماً تماماً، أعد مصفوفة فارغة [].`;
        break;

      case 'custom_prompt':
      default:
        userPrompt = `سياق الرواية:
العنوان: "${context.novelTitle || ''}"
النوع: "${context.genre || ''}"
الفصل: "${context.chapterTitle || ''}"
النص الحالي:
${context.chapterContent ? context.chapterContent.slice(-1500) : ''}

طلب واستفسار الكاتب:
${context.instructions}

أجب الكاتب بأسلوب روائي محترف ومباشر ومفيد جداً لإكمال كتابة الرواية.`;
        break;
    }

    const config: any = {
      systemInstruction,
      temperature: 0.8,
    };

    if (action === 'generate_character_names' || action === 'proofread_text') {
      config.responseMimeType = 'application/json';
    }

    // High-performance models fallback chain
    const FALLBACK_MODELS = [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
    ];

    let outputText = '';
    let lastError: any = null;
    let successfulModel = '';

    for (const modelCandidate of FALLBACK_MODELS) {
      // Retry each model up to 2 times with exponential backoff on 503 / high demand
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[AI Server] Requesting ${action} with model ${modelCandidate} (attempt ${attempt}/2)...`);
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents: userPrompt,
            config,
          });

          if (response && response.text) {
            outputText = response.text;
            successfulModel = modelCandidate;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const msg = (err?.message || '').toLowerCase();
          const isOverloadedOrUnavailable =
            msg.includes('503') ||
            msg.includes('unavailable') ||
            msg.includes('high demand') ||
            msg.includes('overloaded') ||
            msg.includes('resource_exhausted') ||
            msg.includes('429');

          console.warn(`[AI Server] Model ${modelCandidate} failed on attempt ${attempt}: ${err?.message}`);

          if (isOverloadedOrUnavailable && attempt < 2) {
            // Wait 2000ms before retrying the same model
            console.log(`[AI Server] High demand/503 detected. Waiting 2000ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            // Break inner loop to try next fallback model in the chain
            break;
          }
        }
      }

      if (outputText) {
        console.log(`[AI Server] Successfully generated response using model: ${successfulModel}`);
        break;
      }
    }

    if (!outputText) {
      throw lastError || new Error('تعذر إكمال التوليد الأدبي عبر نماذج الذكاء الاصطناعي.');
    }

    return res.json({ result: outputText, modelUsed: successfulModel });
  } catch (error: any) {
    console.error('Error in novel-assist:', error);
    const rawMsg = (error?.message || '').toLowerCase();
    let arabicError = 'الخادم مشغول حالياً بسبب ضغط الطلبات العالي، يرجى المحاولة مجدداً بعد لحظات.';

    if (
      rawMsg.includes('503') ||
      rawMsg.includes('unavailable') ||
      rawMsg.includes('high demand') ||
      rawMsg.includes('overloaded')
    ) {
      arabicError = 'الخادم مشغول حالياً بسبب كثافة الاستخدام، يرجى الانتظار بضع ثوانٍ وإعادة المحاولة.';
    } else if (rawMsg.includes('429') || rawMsg.includes('quota') || rawMsg.includes('resource_exhausted')) {
      arabicError = 'تم بلوغ الحد المؤقت للطلبات، يرجى الانتظار قليلاً ثم إعادة المحاولة.';
    } else if (rawMsg.includes('api_key') || rawMsg.includes('unauthorized')) {
      arabicError = 'مفتاح خدمة الذكاء الاصطناعي غير متوفر أو غير صالح.';
    }

    return res.status(503).json({
      error: arabicError,
      technicalDetails: error?.message || 'Error 503: Model Unavailable',
    });
  }
});

// AI Book Cover Generation Endpoint
app.post('/api/generate-cover', async (req, res) => {
  try {
    const { prompt, style, title } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'يرجى تقديم وصف لمشهد الغلاف' });
    }

    const fullPrompt = `A breathtaking, publication-grade book cover illustration for a novel titled "${title || 'Novel'}".
Description: ${prompt}.
Artistic style: ${style || 'cinematic fine art oil painting, dramatic lighting, detailed masterwork'}.
Atmospheric depth, rich textures, evocative composition.
Aspect ratio 3:4 portrait book format. Strictly no text, no title typography, no logos or letters inside the artwork.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: fullPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: '3:4',
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const base64EncodeString: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        const imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
        return res.json({ imageUrl });
      }
    }

    return res.status(500).json({ error: 'لم يتم العثور على بيانات الصورة في استجابة النموذج.' });
  } catch (error: any) {
    console.error('Error generating cover:', error);
    return res.status(500).json({
      error: error.message || 'حدث خطأ أثناء توليد غلاف الرواية بالذكاء الاصطناعي.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
