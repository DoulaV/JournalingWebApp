// Journaling prompts and a small, deterministic picker.
// Arabic prompts are written in the first person, as the writer's own question to themselves,
// which reads naturally in a journal and avoids gendered address.

import type { CoreId } from "./emotions";

export type PromptCategory = CoreId | "general" | "weekly";
export interface Prompt {
  id: string;
  category: PromptCategory;
  middle?: string;
  en: string;
  ar: string;
}

function p(id: string, category: PromptCategory, en: string, ar: string, middle?: string): Prompt {
  return middle ? { id, category, middle, en, ar } : { id, category, en, ar };
}

export const PROMPTS: Prompt[] = [
  // Happy: help savour the moment.
  p(
    "happy-moment",
    "happy",
    "What moment today would you like to remember?",
    "ما اللحظة التي أودّ أن أتذكرها من اليوم؟",
  ),
  p(
    "happy-shared",
    "happy",
    "Who shared this good feeling with you, or who would you like to tell?",
    "من شاركني هذا الشعور الجميل، ولمن أودّ أن أحكي عنه؟",
  ),
  p(
    "happy-body",
    "happy",
    "Where do you feel this happiness in your body?",
    "أين أشعر بهذه السعادة في جسدي؟",
  ),
  p(
    "happy-small-thing",
    "happy",
    "What small thing added to this feeling?",
    "ما الشيء الصغير الذي أضاف إلى هذا الشعور؟",
  ),
  p(
    "happy-grow",
    "happy",
    "What helped this feeling grow, and how could you make more room for it?",
    "ما الذي ساعد هذا الشعور على أن يكبر، وكيف أفسح له مكانًا أكبر في أيامي؟",
  ),
  p(
    "happy-senses",
    "happy",
    "What did you see, hear or taste today that you want to hold on to?",
    "ماذا رأيت أو سمعت أو تذوقت اليوم وأودّ أن أحتفظ به؟",
  ),
  p(
    "happy-values",
    "happy",
    "What does this joy say about what matters to you?",
    "ماذا يخبرني هذا الفرح عمّا يهمّني حقًا؟",
  ),
  p(
    "happy-grateful",
    "happy",
    "Who or what are you grateful for right now?",
    "لمن أو لماذا أشعر بالامتنان الآن؟",
  ),
  p(
    "happy-proud-made-possible",
    "happy",
    "What did you do that made this possible?",
    "ما الذي فعلته وجعل هذا ممكنًا؟",
    "proud",
  ),
  p(
    "happy-peaceful-settled",
    "happy",
    "What helped you feel settled today?",
    "ما الذي ساعدني على الشعور بالسكينة اليوم؟",
    "peaceful",
  ),

  // Sad: gentle and compassionate.
  p(
    "sad-heaviest",
    "sad",
    "What feels heaviest right now?",
    "ما الذي يثقل قلبي أكثر من غيره الآن؟",
  ),
  p(
    "sad-friend",
    "sad",
    "What would you say to a close friend feeling this way?",
    "ماذا كنت سأقول لصديق عزيز يمرّ بالشعور نفسه؟",
  ),
  p(
    "sad-need",
    "sad",
    "What do you need most in this moment?",
    "ما الذي أحتاجه أكثر في هذه اللحظة؟",
  ),
  p(
    "sad-missing",
    "sad",
    "Is there something you are missing or grieving?",
    "هل هناك شيء أفتقده أو أحزن على غيابه؟",
  ),
  p(
    "sad-body",
    "sad",
    "Where does this sadness sit in your body?",
    "أين يستقرّ هذا الحزن في جسدي؟",
  ),
  p(
    "sad-comfort",
    "sad",
    "What has comforted you before, even a little?",
    "ما الذي واساني من قبل، ولو قليلًا؟",
  ),
  p(
    "sad-gentle",
    "sad",
    "What would being gentle with yourself look like today?",
    "كيف يبدو اللطف مع نفسي اليوم؟",
  ),
  p(
    "sad-care",
    "sad",
    "What does this sadness tell you about what you care about?",
    "ماذا يخبرني هذا الحزن عمّا يهمّني؟",
  ),
  p(
    "sad-unsaid",
    "sad",
    "Is there something you wish you could say to someone?",
    "هل هناك كلام أتمنى لو أستطيع قوله لأحد؟",
  ),
  p(
    "sad-lonely-miss",
    "sad",
    "Who do you miss, and what do you miss about them?",
    "من أفتقد، وما الذي أفتقده فيه؟",
    "lonely",
  ),
  p(
    "sad-guilty-forgive",
    "sad",
    "What would it mean to forgive yourself a little?",
    "ماذا يعني لي أن أسامح نفسي ولو قليلًا؟",
    "guilty",
  ),

  // Angry: curious about what the anger protects.
  p(
    "angry-before",
    "angry",
    "What happened just before this anger arrived?",
    "ماذا حدث قبيل أن يأتي هذا الغضب؟",
  ),
  p(
    "angry-boundary",
    "angry",
    "Which of your boundaries feels crossed?",
    "أيّ حدودي أشعر بأنها تُجووزت؟",
  ),
  p(
    "angry-protect",
    "angry",
    "What is this anger trying to protect?",
    "ما الذي يحاول هذا الغضب أن يحميه؟",
  ),
  p("angry-body", "angry", "Where do you feel the anger in your body?", "أين أشعر بالغضب في جسدي؟"),
  p(
    "angry-underneath",
    "angry",
    "Is there another feeling sitting underneath the anger?",
    "هل يختبئ شعور آخر تحت هذا الغضب؟",
  ),
  p(
    "angry-unsaid",
    "angry",
    "If you could say exactly what you feel, without holding back, what would it be?",
    "لو استطعت أن أقول ما أشعر به تمامًا دون تحفّظ، ماذا سأقول؟",
  ),
  p(
    "angry-value",
    "angry",
    "Which of your values feels challenged right now?",
    "أيّ قيمة من قيمي أشعر بأنها تُمسّ الآن؟",
  ),
  p(
    "angry-week-later",
    "angry",
    "How might this look to you a week from now?",
    "كيف قد أرى هذا الموقف بعد أسبوع من الآن؟",
  ),
  p(
    "angry-frustrated-need",
    "angry",
    "What did you need that you didn't get?",
    "ما الذي كنت أحتاجه ولم أحصل عليه؟",
    "frustrated",
  ),
  p(
    "angry-let-down-hope",
    "angry",
    "What did you hope would happen?",
    "ما الذي كنت آمل أن يحدث؟",
    "let-down",
  ),

  // Fearful: steadying, never dismissive.
  p(
    "fearful-uncertain",
    "fearful",
    "What exactly feels uncertain right now?",
    "ما الذي يبدو لي غامضًا أو غير مؤكد الآن؟",
  ),
  p(
    "fearful-safer",
    "fearful",
    "What helps you feel even a little safer?",
    "ما الذي يساعدني على الشعور بأمان أكبر، ولو قليلًا؟",
  ),
  p(
    "fearful-body",
    "fearful",
    "Where do you notice this fear in your body?",
    "أين ألاحظ هذا الخوف في جسدي؟",
  ),
  p(
    "fearful-control",
    "fearful",
    "What is within your control, and what isn't?",
    "ما الذي في يدي، وما الذي ليس في يدي؟",
  ),
  p(
    "fearful-before",
    "fearful",
    "When have you faced something like this before, and what helped?",
    "متى واجهت شيئًا كهذا من قبل، وما الذي ساعدني حينها؟",
  ),
  p(
    "fearful-protect",
    "fearful",
    "What is this fear trying to keep safe?",
    "ما الذي يحاول هذا الخوف أن يحفظه؟",
  ),
  p(
    "fearful-lean-on",
    "fearful",
    "Who could you lean on right now?",
    "على من أستطيع أن أستند الآن؟",
  ),
  p(
    "fearful-kind-voice",
    "fearful",
    "What would a kind voice say to you about this?",
    "ماذا سيقول لي صوت حنون عن هذا الأمر؟",
  ),
  p(
    "fearful-anxious-worst-case",
    "fearful",
    "What's the worst case, and how likely is it really?",
    "ما أسوأ ما قد يحدث، وما مدى احتمال حدوثه فعلًا؟",
    "anxious",
  ),
  p(
    "fearful-rejected-acceptance",
    "fearful",
    "Whose acceptance matters most to you right now, and why?",
    "قبول من يهمّني أكثر الآن، ولماذا؟",
    "rejected",
  ),

  // Bad: low energy, stress, care for the body.
  p("bad-heavy", "bad", "What made today feel heavy?", "ما الذي جعل اليوم ثقيلًا عليّ؟"),
  p("bad-body-needs", "bad", "What does your body need right now?", "ما الذي يحتاجه جسدي الآن؟"),
  p(
    "bad-set-down",
    "bad",
    "What could you set down, even for an hour?",
    "ما الذي أستطيع أن أضعه جانبًا، ولو لساعة؟",
  ),
  p(
    "bad-attention",
    "bad",
    "What has been asking for your attention lately?",
    "ما الذي يطلب انتباهي في الآونة الأخيرة؟",
  ),
  p(
    "bad-enough",
    "bad",
    "What would help today feel like enough?",
    "ما الذي يجعلني أشعر بأن ما قدّمته اليوم يكفي؟",
  ),
  p(
    "bad-small-kindness",
    "bad",
    "What is one small kindness you could offer yourself?",
    "ما اللفتة اللطيفة الصغيرة التي أستطيع أن أقدّمها لنفسي؟",
  ),
  p(
    "bad-building",
    "bad",
    "Has this feeling been building for a while?",
    "هل يتراكم هذا الشعور منذ مدة؟",
  ),
  p(
    "bad-colour-shape",
    "bad",
    "If this feeling had a colour or a shape, what would it be?",
    "لو كان لهذا الشعور لون أو شكل، فماذا سيكون؟",
  ),
  p(
    "bad-tired-drained",
    "bad",
    "What drained you today, and what could refill you?",
    "ما الذي استنزف طاقتي اليوم، وما الذي قد يعيدها إليّ؟",
    "tired",
  ),
  p(
    "bad-stressed-carry",
    "bad",
    "What feels most urgent, and is it truly yours to carry?",
    "ما الذي يبدو أكثر إلحاحًا، وهل هو حقًا حمل عليّ أن أحمله؟",
    "stressed",
  ),
  p(
    "bad-bored-interest",
    "bad",
    "What might spark a little interest for you right now?",
    "ما الذي قد يثير اهتمامي ولو قليلًا الآن؟",
    "bored",
  ),

  // Surprised: curious about what shifted.
  p("surprised-caught", "surprised", "What caught you off guard today?", "ما الذي فاجأني اليوم؟"),
  p(
    "surprised-expected",
    "surprised",
    "What were you expecting instead?",
    "ما الذي كنت أتوقعه بدلًا من ذلك؟",
  ),
  p(
    "surprised-taught",
    "surprised",
    "What did this surprise teach you?",
    "ماذا علّمتني هذه المفاجأة؟",
  ),
  p(
    "surprised-body",
    "surprised",
    "How did your body react in that first moment?",
    "كيف تفاعل جسدي في اللحظة الأولى؟",
  ),
  p(
    "surprised-view",
    "surprised",
    "Has this changed how you see something or someone?",
    "هل غيّر هذا نظرتي إلى أمر ما أو إلى شخص ما؟",
  ),
  p(
    "surprised-welcome",
    "surprised",
    "Is this surprise welcome, unwelcome, or a bit of both?",
    "هل هذه المفاجأة سارّة أم غير سارّة، أم فيها شيء من الاثنين؟",
  ),
  p(
    "surprised-possible",
    "surprised",
    "What feels possible now that didn't before?",
    "ما الذي يبدو ممكنًا الآن ولم يكن كذلك من قبل؟",
  ),
  p(
    "surprised-tell",
    "surprised",
    "Who would you like to tell about this, and why them?",
    "لمن أودّ أن أحكي عن هذا، ولماذا هذا الشخص بالذات؟",
  ),
  p(
    "surprised-excited-looking-forward",
    "surprised",
    "What are you most looking forward to?",
    "ما أكثر ما أتطلع إليه؟",
    "excited",
  ),
  p(
    "surprised-confused-know",
    "surprised",
    "What is one thing you do know for sure right now?",
    "ما الشيء الذي أعرفه يقينًا الآن؟",
    "confused",
  ),

  // Disgusted: values and boundaries, with kindness.
  p(
    "disgusted-wrong",
    "disgusted",
    "What felt wrong to you today?",
    "ما الذي بدا لي خاطئًا اليوم؟",
  ),
  p(
    "disgusted-values",
    "disgusted",
    "Which of your values does this go against?",
    "أيّ قيمي يتعارض معها هذا الأمر؟",
  ),
  p(
    "disgusted-step-away",
    "disgusted",
    "What do you want to step away from?",
    "ما الذي أرغب في الابتعاد عنه؟",
  ),
  p(
    "disgusted-body",
    "disgusted",
    "How does your body respond when you think about it?",
    "كيف يستجيب جسدي حين أفكر في الأمر؟",
  ),
  p(
    "disgusted-protect",
    "disgusted",
    "What is this feeling protecting you from?",
    "مما يحميني هذا الشعور؟",
  ),
  p(
    "disgusted-boundary",
    "disgusted",
    "Is there a boundary you would like to set?",
    "هل هناك حدّ أودّ أن أضعه؟",
  ),
  p(
    "disgusted-self",
    "disgusted",
    "Is any of this feeling turned toward yourself? If so, what would kindness say?",
    "هل يتجه شيء من هذا الشعور نحو نفسي؟ وإن كان كذلك، فماذا سيقول اللطف؟",
  ),
  p(
    "disgusted-clear",
    "disgusted",
    "What would help you feel clear and settled again?",
    "ما الذي قد يعيد إليّ الصفاء والهدوء؟",
  ),
  p(
    "disgusted-disapproving-instead",
    "disgusted",
    "What would you have liked to see happen instead?",
    "ما الذي كنت أودّ أن أراه يحدث بدلًا من ذلك؟",
    "disapproving",
  ),

  // General: open reflection for any day.
  p("general-on-mind", "general", "What's on your mind right now?", "ما الذي يشغل بالي الآن؟"),
  p(
    "general-noticed",
    "general",
    "What is one thing you noticed today?",
    "ما الشيء الذي لاحظته اليوم؟",
  ),
  p("general-heart", "general", "How is your heart today, honestly?", "كيف حال قلبي اليوم، بصدق؟"),
  p(
    "general-need-more",
    "general",
    "What do you need more of this week?",
    "ما الذي أحتاج إلى المزيد منه هذا الأسبوع؟",
  ),
  p("general-need-less", "general", "What do you need less of?", "ما الذي أحتاج إلى التخفيف منه؟"),
  p(
    "general-felt-good",
    "general",
    "What felt good, even briefly?",
    "ما الذي أشعرني بالراحة، ولو لوقت قصير؟",
  ),
  p(
    "general-conversation",
    "general",
    "Which conversation stayed with you today?",
    "أيّ حديث بقي عالقًا في ذهني اليوم؟",
  ),
  p(
    "general-not-yours",
    "general",
    "What are you carrying that isn't yours to carry?",
    "ما الذي أحمله وليس لي أن أحمله؟",
  ),
  p(
    "general-lighter-tomorrow",
    "general",
    "What would make tomorrow a little lighter?",
    "ما الذي قد يجعل الغد أخفّ قليلًا؟",
  ),
  p(
    "general-smile",
    "general",
    "What made you smile recently?",
    "ما الذي رسم ابتسامة على وجهي مؤخرًا؟",
  ),
  p(
    "general-learning",
    "general",
    "What are you learning about yourself these days?",
    "ما الذي أتعلمه عن نفسي هذه الأيام؟",
  ),
  p("general-let-go", "general", "What would you like to let go of?", "ما الذي أودّ أن أتخلى عنه؟"),
  p(
    "general-supported",
    "general",
    "Who or what supported you lately?",
    "من أو ما الذي ساندني في الفترة الأخيرة؟",
  ),
  p(
    "general-rest",
    "general",
    "What does rest look like for you right now?",
    "كيف تبدو الراحة بالنسبة إليّ الآن؟",
  ),
  p(
    "general-title",
    "general",
    "If today had a title, what would it be?",
    "لو كان لهذا اليوم عنوان، فماذا سيكون؟",
  ),
  p(
    "general-remember-week",
    "general",
    "What do you want to remember from this week?",
    "ما الذي أودّ أن أتذكره من هذا الأسبوع؟",
  ),
  p(
    "general-visited",
    "general",
    "Which feeling visited you most often today?",
    "أيّ شعور زارني أكثر من غيره اليوم؟",
  ),
  p(
    "general-most-myself",
    "general",
    "When did you feel most like yourself recently?",
    "متى شعرت مؤخرًا بأنني على طبيعتي أكثر؟",
  ),
];

export const RITUAL_PROMPTS: {
  morning: { en: string; ar: string };
  evening: { en: string; ar: string };
} = {
  morning: { en: "How do I want to feel today?", ar: "كيف أودّ أن أشعر اليوم؟" },
  evening: { en: "How did I actually feel today?", ar: "كيف شعرت فعلًا اليوم؟" },
};

export const WEEKLY_REVIEW_PROMPT: Prompt = {
  id: "weekly-pattern",
  category: "weekly",
  en: "What pattern did you notice this week?",
  ar: "ما النمط الذي لاحظته في مشاعري هذا الأسبوع؟",
};

export interface PromptHistoryItem {
  promptId: string;
  shownOn: string; // "YYYY-MM-DD"
}

export const NO_REPEAT_DAYS = 14;

export function getPrompt(id: string): Prompt | undefined {
  if (id === WEEKLY_REVIEW_PROMPT.id) return WEEKLY_REVIEW_PROMPT;
  return PROMPTS.find((x) => x.id === id);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(ymd: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return NaN;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Whole days from `from` to `to` (positive when `to` is later). NaN on bad input. */
export function dayDiff(to: string, from: string): number {
  return Math.round((utcDay(to) - utcDay(from)) / DAY_MS);
}

export function pickPrompt(opts: {
  core?: CoreId | null;
  middle?: string | null;
  today: string;
  history: PromptHistoryItem[];
  random?: () => number;
}): Prompt {
  const { core, middle, today, history } = opts;
  const random = opts.random ?? Math.random;

  const recent = new Set<string>();
  const lastShown = new Map<string, string>();
  for (const h of history) {
    const d = dayDiff(today, h.shownOn);
    if (d >= 0 && d < NO_REPEAT_DAYS) recent.add(h.promptId);
    const prev = lastShown.get(h.promptId);
    if (prev === undefined || h.shownOn > prev) lastShown.set(h.promptId, h.shownOn);
  }

  const pool = PROMPTS.filter((x) => x.category !== "weekly");
  const tiers: Prompt[][] = [];
  if (core) {
    if (middle) tiers.push(pool.filter((x) => x.category === core && x.middle === middle));
    tiers.push(pool.filter((x) => x.category === core && !x.middle));
  }
  tiers.push(pool.filter((x) => x.category === "general"));

  for (const tier of tiers) {
    const fresh = tier.filter((x) => !recent.has(x.id));
    if (fresh.length > 0) {
      const r = random();
      const i = Math.min(fresh.length - 1, Math.max(0, Math.floor(r * fresh.length)));
      return fresh[i];
    }
  }

  // Everything is recent: return the least recently shown, never-shown first, in tier order.
  const all = tiers.flat();
  let best = all[0];
  let bestDate = lastShown.get(best.id) ?? "";
  for (const x of all) {
    const d = lastShown.get(x.id) ?? "";
    if (d < bestDate) {
      best = x;
      bestDate = d;
    }
  }
  return best;
}
