/**
 * Islamic Q&A assistant.
 *
 * Two modes, both honest about what they are:
 *  - "model": a language model answers, constrained to the curated knowledge base
 *    passages supplied as context and required to cite them.
 *  - "knowledge-base": when no model key is configured, answers come from the
 *    curated entries below only. It never invents a verse or hadith.
 */
const KB = [
  {
    id: 'pillars',
    keys: ['pillar', 'five pillars', 'arkaan', 'shahada', 'shahadah', 'islam basics'],
    en: 'Islam is built on five pillars: the testimony of faith (shahada), the five daily prayers (salah), giving zakat, fasting Ramadan, and performing Hajj for those who are able.',
    ar: 'بُني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمداً رسول الله، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت لمن استطاع إليه سبيلاً.',
    so: 'Islaamku wuxuu ku dhisan yahay shan tiir: shahaadada, salaadda shanta waqti, sakada, soonka Ramadaan, iyo Xajka qofka awooda.',
    refs: [
      { type: 'hadith', text: 'Sahih al-Bukhari 8; Sahih Muslim 16' },
      { type: 'quran', text: 'Quran 2:43, 2:183, 3:97' },
    ],
  },
  {
    id: 'prayer-times',
    keys: ['prayer time', 'salah time', 'fajr time', 'maghrib time', 'when is prayer', 'waqt'],
    en: 'Prayer times follow the position of the sun at your location. Fajr begins at true dawn, Dhuhr after the sun passes its zenith, Asr when an object’s shadow equals (or twice equals, Hanafi) its length plus the noon shadow, Maghrib at sunset, and Isha when twilight ends. Because the calculation depends on latitude, longitude, date and the convention used, RIFQ Muslim computes times from your coordinates and lets you choose the method — always confirm with your local mosque.',
    ar: 'أوقات الصلاة مرتبطة بموضع الشمس في مكانك: الفجر عند الفجر الصادق، والظهر بعد الزوال، والعصر عندما يصير ظل الشيء مثله (أو مثليه عند الحنفية) زيادة على ظل الزوال، والمغرب عند الغروب، والعشاء عند مغيب الشفق. ويُرجع إلى تقويم المسجد المحلي للتأكيد.',
    so: 'Waqtiyada salaaddu waxay ku xiran yihiin mawqifka qorraxda aaggaaga. Fajarka waa iftiinka runta ah, Duhur waa qorraxda ka dib, Casr waa marka hadhku la simo (ama labanlaabo Hanafi), Maqrib waa qorrax-dhaca, Cishaha waa marka iftiinka gudcurka tago. Hubi waqtiga masjidkaaga.',
    refs: [{ type: 'quran', text: 'Quran 17:78, 11:114, 2:238' }],
  },
  {
    id: 'wudu',
    keys: ['wudu', 'ablution', 'wudhu', 'purification', 'tayammum'],
    en: 'Wudu: intend purification, wash the hands, rinse the mouth, sniff water into the nose, wash the face, wash both arms to the elbows, wipe the head, wash the feet to the ankles — maintaining order and continuity. If water is unavailable or harmful, tayammum with clean earth is permitted.',
    ar: 'الوضوء: النية، غسل الكفين، المضمضة، الاستنشاق، غسل الوجه، غسل الذراعين إلى المرفقين، مسح الرأس، غسل الرجلين إلى الكعبين، مع الترتيب والموالاة. ويُشرع التيمم عند تعذّر الماء.',
    so: 'Wudhu: niyad, gacmo dhaqid, afka dhaqid, sanka, wejiga, gacmaha ilaa xusulka, madaxa masax, cagaha ilaa anqawga. Haddii biyo la waayo, tayammum baa la sameeyaa.',
    refs: [{ type: 'quran', text: 'Quran 5:6' }, { type: 'hadith', text: 'Sahih al-Bukhari 159; Sahih Muslim 226' }],
  },
  {
    id: 'zakat',
    keys: ['zakat', 'zakah', 'nisab', 'charity obligation', 'sakada'],
    en: 'Zakat is 2.5% of qualifying wealth held for one lunar year above the nisab. The nisab is 87.48g of gold or 612.36g of silver (silver is safer for the poor). Debts you must pay and immediate needs are deducted first. Complex cases — business inventory, agriculture, livestock, shares — should be checked with a qualified scholar.',
    ar: 'الزكاة 2.5% من المال الذي بلغ النصاب وحال عليه الحول. والنصاب 87.48 غراماً من الذهب أو 612.36 غراماً من الفضة. وتُخصم الديون الحالّة والحاجات الأساسية. والحالات المعقدة تُراجع فيها أهل العلم.',
    so: 'Sakadu waa 2.5% ee maalka gaaray nisaabka oo sanad qamari ah haystay. Nisaabku waa 87.48g dahab ama 612.36g lacag. Deymaha lagu leeyahay waa la gooyaa. Xaaladaha adag la tasho culimada.',
    refs: [{ type: 'quran', text: 'Quran 9:60, 2:110' }, { type: 'hadith', text: 'Sahih al-Bukhari 1454' }],
  },
  {
    id: 'fasting',
    keys: ['fasting', 'ramadan', 'suhoor', 'iftar', 'breaking fast', 'sick', 'travel'],
    en: 'Fasting Ramadan is obligatory for able adults. Suhoor lasts until Fajr and iftar begins at Maghrib. The sick, travellers, pregnant or nursing women and others with valid excuses may defer the fast and make it up later (or feed the poor where applicable). Deliberately breaking a fast without excuse requires repentance and making it up.',
    ar: 'صوم رمضان واجب على البالغ القادر. السحور إلى الفجر والإفطار عند المغرب. ويُرخّص للمريض والمسافر والحامل والمرضع، مع القضاء. ومن أفطر متعمداً بلا عذر وجب عليه التوبة والقضاء.',
    so: 'Soonka Ramadaan waa waajib qofka weyn ee awooda. Suhuur ilaa Fajr, afurka Maqrib. Qofka bukaanka ah, safarka, uurka leh ama nuujinaya waa loo fududeynayaa, soonka dib ayuu u qaban karaa.',
    refs: [{ type: 'quran', text: 'Quran 2:183-185' }],
  },
  {
    id: 'qibla',
    keys: ['qibla', 'direction', 'kaaba', 'which way', 'compass'],
    en: 'The qibla is the shortest great-circle direction from your position to the Kaaba in Makkah (21.4225°N, 39.8262°E). RIFQ Muslim computes that bearing from your coordinates and compares it with the device compass. Phones with magnetic sensors need calibration — move the phone in a figure eight and keep away from metal.',
    ar: 'القبلة هي أقصر اتجاه دائري من موقعك إلى الكعبة في مكة (21.4225 شمالاً، 39.8262 شرقاً). ويُحسب الاتجاه من إحداثياتك ويُقارن ببوصلة الجهاز، مع معايرة البوصلة.',
    so: 'Qibladu waa jihada ugu gaaban ee ka timaadda goobtaada ilaa Kacbada Maka (21.4225N, 39.8262E). App-ku wuxuu xisaabiyaa jihada, kombuyuutarka telefoonkana waa la hagaajiyaa (figure eight).',
    refs: [{ type: 'quran', text: 'Quran 2:144' }],
  },
  {
    id: 'dua-anxiety',
    keys: ['anxiety', 'sad', 'worry', 'stress', 'hardship', 'depressed', 'dua for'],
    en: 'The Prophet ﷺ taught: “O Allah, I seek refuge in You from anxiety and sorrow, from incapacity and laziness, from miserliness and cowardice, and from the burden of debt.” (Sahih al-Bukhari 2893). He also taught “Allahumma inni as’aluka al-‘afwa wal-‘afiyah”. Alongside dua, take practical steps and consult people who can help.',
    ar: 'كان النبي ﷺ يقول: «اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وضلع الدين» (صحيح البخاري 2893). ويُشرع أيضاً: «اللهم إني أسألك العفو والعافية». ومع الدعاء يُؤخذ بالأسباب.',
    so: 'Nabiga ﷺ wuxuu yiri: «Alle waxaan kaa magan galayaa walbahaar, murugo, tabar-darro, caajis, bakhaylnimo, fulaynnimo iyo deyn culayskiisa» (Bukhaari 2893). Ducooyinkaas la socodsii tallaabooyin wax ku ool ah.',
    refs: [{ type: 'hadith', text: 'Sahih al-Bukhari 2893, 6369' }, { type: 'quran', text: 'Quran 94:5-6, 2:286' }],
  },
  {
    id: 'tawbah',
    keys: ['repentance', 'sin', 'tawbah', 'forgive', 'guilt', 'mistake'],
    en: 'Sincere repentance has three conditions: stop the sin, regret it, and resolve not to return to it; if a right of another person was taken, restore it or seek their forgiveness. Allah says: “Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah.” (Quran 39:53)',
    ar: 'التوبة الصادقة: الإقلاع عن الذنب، والندم عليه، والعزم على عدم العودة؛ وإن تعلّق بحق آدمي رُدّ الحق أو استُحلّ منه. قال تعالى: ﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ﴾ الزمر 53.',
    so: 'Towbadu saddex shuruud bay leedahay: joojinta dembiga, ka qoomamayn, iyo go\'aanka ah in aan dib loogu noqon; haddii xuquuq qof kale ku lug leh, waa la celiyaa. (Qur\'aan 39:53)',
    refs: [{ type: 'quran', text: 'Quran 39:53, 25:70' }, { type: 'hadith', text: 'Sahih Muslim 2749' }],
  },
  {
    id: 'halal-food',
    keys: ['halal', 'haram food', 'pork', 'alcohol', 'slaughter', 'food'],
    en: 'The default rule for food is permissibility. Explicitly forbidden: pork, blood, carrion, intoxicants, and meat dedicated to other than Allah. Meat must be slaughtered by a Muslim with a sharp blade, mentioning Allah’s name. Where a product’s status is unclear, look for a recognised halal certification and avoid doubtful items.',
    ar: 'الأصل في الأطعمة الإباحة. ويحرم: لحم الخنزير، والدم، والميتة، والمسكرات، وما أُهلّ لغير الله. ويُشترط في الذبيحة أن تكون من مسلم مع التسمية. والمشتبه يُجتنب.',
    so: 'Asalka cuntadu waa xalaal. Waxa xaaraan ah: hilibka doofaarka, dhiig, bakhti, khamri, iyo waxa Allah ka sokow loo gowracay. Hilibka waa in uu gowraco Muslim oo magaca Allah ku xuso. Haddii shaki jiro, raadi shahaado xalaal.',
    refs: [{ type: 'quran', text: 'Quran 2:168-173, 5:3' }, { type: 'hadith', text: 'Sahih Muslim 1955' }],
  },
  {
    id: 'parents',
    keys: ['parents', 'mother', 'father', 'family', 'kindness'],
    en: 'Kindness to parents is one of the greatest acts of worship. Allah says: “And your Lord has decreed that you worship none but Him, and that you be kind to parents.” (Quran 17:23). Even if they are not Muslim, you are commanded to treat them well in worldly matters (Quran 31:15).',
    ar: 'بر الوالدين من أعظم القربات: ﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا﴾ الإسراء 23. وإن كانا غير مسلمين فالإحسان إليهما مأمور به في الدنيا (لقمان 15).',
    so: 'Wanaagga waalidka waa mid ka mid ah camallada ugu wanaagsan: ﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا﴾ (Israa 23).',
    refs: [{ type: 'quran', text: 'Quran 17:23-24, 31:15' }, { type: 'hadith', text: 'Sahih al-Bukhari 5971' }],
  },
  {
    id: 'riba',
    keys: ['interest', 'riba', 'bank', 'loan', 'mortgage'],
    en: 'Riba (interest) is prohibited in the strongest terms (Quran 2:275-279). Modern banking involves details that scholars have discussed extensively; practical solutions such as Islamic banks, murabaha and specific fatwas on necessity are best confirmed with a qualified scholar who knows your situation.',
    ar: 'الربا محرّم: ﴿وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا﴾ البقرة 275. والمعاملات المصرفية المعاصرة لها تفصيلات، والأفضل مراجعة أهل العلم لبيان الحكم في حالتك.',
    so: 'Ribadu waa xaaraan (Qur\'aan 2:275-279). Bangiyada casriga ah waxay leeyihiin tafaasiil culimadu ka hadashay; la tasho aalim yaqaan xaaladdaada.',
    refs: [{ type: 'quran', text: 'Quran 2:275-279' }],
  },
  {
    id: 'hajj',
    keys: ['hajj', 'umrah', 'ihram', 'tawaf', 'sai', 'pilgrimage'],
    en: 'Hajj is performed in Dhul-Hijjah: ihram, tawaf al-qudum, sa’i between Safa and Marwa, standing at Arafah on 9 Dhul-Hijjah, Muzdalifah, Mina, stoning the jamarat, sacrifice, halq or taqsir, and tawaf al-ifadah. Umrah is ihram, tawaf, sa’i and cutting hair, and may be done any time of year.',
    ar: 'الحج في ذي الحجة: الإحرام، طواف القدوم، السعي بين الصفا والمروة، الوقوف بعرفة، مزدلفة، منى، رمي الجمرات، الهدي، الحلق أو التقصير، طواف الإفاضة. والعمرة: إحرام وطواف وسعي وحلق، في أي وقت.',
    so: 'Xajka wuxuu dhacaa Dhul-Xijjah: ihraam, tawaaf, saci, Arafah maalinta 9aad, Muzdalifah, Mina, jamiro, hadiyad, xiiq ama gooyn, tawaaf al-ifaadah. Cumraduna waa ihraam, tawaaf, saci iyo timo gooyn, waqti kasta.',
    refs: [{ type: 'quran', text: 'Quran 2:196-203, 22:27-29' }, { type: 'hadith', text: 'Sahih al-Bukhari 1651; Sahih Muslim 1218' }],
  },
  {
    id: 'quran-reading',
    keys: ['quran reading', 'recite', 'tajweed', 'how to read', 'quran etiquette'],
    en: 'Recite the Quran with respect: be in a state of purity, seek refuge (“A‘udhu billahi min ash-shaytan ir-rajim”), say “Bismillah”, and recite slowly (tartil, Quran 73:4). Understanding and acting on what you read matters more than speed. Learning tajweed with a teacher is the reliable path.',
    ar: 'يُستحب عند القراءة: الطهارة، والاستعاذة، والبسملة، والترتيل ﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾ المزمل 4. والتفهّم والعمل مقدم على السرعة، وتعلم التجويد يكون على يد معلم.',
    so: 'Qur\'aanka akhriskiisa: nadiifnimo, awoodsi (A\'uudhu billaah), Bismillah, tartiil (Muzzammil 4). Fahamka iyo camalka ayaa ka muhiimsan xawaaraha; tajwiidka baro macalin.',
    refs: [{ type: 'quran', text: 'Quran 73:4, 16:98' }, { type: 'hadith', text: 'Sahih al-Bukhari 5027' }],
  },
  {
    id: 'madhhab',
    keys: ['madhhab', 'school of thought', 'difference', 'hanafi', 'shafii', 'maliki', 'hanbali'],
    en: 'The four Sunni schools (Hanafi, Maliki, Shafi‘i, Hanbali) differ in some details of practice while agreeing on the core of the religion. Differences usually come from how a text is interpreted or which reports are accepted. Follow a reliable local scholar or school consistently, and do not turn differences into division.',
    ar: 'المذاهب الأربعة (الحنفي والمالكي والشافعي والحنبلي) تختلف في بعض الفروع وتتفق في الأصول. والخلاف غالباً في فهم النص أو ثبوت الخبر. ويُتبع أهل العلم الموثوقين دون تنازع.',
    so: 'Afarta madhhab (Xanafi, Maaliki, Shaafici, Xanbali) waxay ku kala duwan yihiin qaybo farac ah, laakiin asalka diinta way ku midoobaan. Raac cilmi yaqaan lagu kalsoonaan karo, khilaafkana ha u beddelin kala qaybsanaan.',
    refs: [{ type: 'quran', text: 'Quran 4:59, 3:103' }],
  },
];

const MAX_CHARS = 1200;

function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchKnowledge(question, lang = 'en') {
  const q = normalise(question);
  const words = q.split(' ').filter((w) => w.length > 2);
  let best = null;
  let bestScore = 0;
  for (const entry of KB) {
    let score = 0;
    for (const key of entry.keys) {
      if (q.includes(key)) score += key.includes(' ') ? 4 : 3;
    }
    for (const w of words) {
      if (entry.keys.some((k) => k.includes(w))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (!best || bestScore < 2) return null;
  const language = lang === 'ar' || lang === 'so' ? lang : 'en';
  return { id: best.id, answer: best[language] || best.en, refs: best.refs, score: bestScore };
}

const SYSTEM_PROMPT = `You are the RIFQ Muslim in-app Islamic assistant.
Rules you must follow:
- Answer only from the knowledge base passages provided. If they do not cover the question, say plainly that you do not have reliable evidence in this app and recommend asking a qualified scholar.
- Never invent Quran verses, hadith numbers, or scholarly opinions. Quote references exactly as given in the passages.
- Distinguish clearly between agreed teachings and matters where scholars differ.
- You are not a mufti. For serious personal rulings (marriage, divorce, finance, inheritance, medical), advise consulting a qualified scholar.
- Answer in the user's language: {{LANG}}. Keep answers under 220 words, warm and clear.
- Never ask for or repeat personal or sensitive information.`;

function contextFromKb(lang) {
  return KB.map((e) => {
    const text = lang === 'ar' ? e.ar : lang === 'so' ? e.so : e.en;
    return `[${e.id}] ${text} (references: ${e.refs.map((r) => r.text).join('; ')})`;
  }).join('\n');
}

export async function answerQuestion({ question, lang = 'en', history = [] }) {
  const q = String(question || '').slice(0, MAX_CHARS).trim();
  if (!q) return { error: 'Please type a question.' };
  const language = lang === 'ar' || lang === 'so' ? lang : 'en';
  const kb = searchKnowledge(q, language);
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.ASSISTANT_MODEL || 'gpt-4o-mini';

  if (key) {
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT.replace('{{LANG}}', language) },
        {
          role: 'system',
          content: `Knowledge base passages you may use:\n${contextFromKb(language)}`,
        },
        ...history
          .slice(-4)
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1500) })),
        { role: 'user', content: q },
      ];
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 500 }),
      });
      const data = await res.json().catch(() => ({}));
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (res.ok && answer) {
        return {
          mode: 'model',
          answer,
          references: kb ? kb.refs : [],
          matchedTopic: kb ? kb.id : null,
          disclaimer:
            'Answered by the RIFQ Muslim assistant using curated references. Not a fatwa — consult a qualified scholar for personal rulings.',
        };
      }
      // fall through to knowledge base with an honest note
      const reason = data?.error?.message || `Assistant model returned ${res.status}.`;
      return {
        mode: 'knowledge-base',
        answer: kb ? kb.answer : null,
        references: kb ? kb.refs : [],
        matchedTopic: kb ? kb.id : null,
        note: `The AI model is currently unavailable (${reason}). Showing the curated answer instead.`,
      };
    } catch {
      // fall through
    }
  }

  if (kb) {
    return {
      mode: 'knowledge-base',
      answer: kb.answer,
      references: kb.refs,
      matchedTopic: kb.id,
      note:
        'This answer comes from the app’s curated knowledge base with references. Connect a model API key to enable conversational AI answers.',
    };
  }
  return {
    mode: 'knowledge-base',
    answer: null,
    references: [],
    matchedTopic: null,
    note: 'I do not have reliable evidence for this question in the app’s curated knowledge base, so I will not guess. Please consult a qualified scholar, or ask about prayer, wudu, zakat, fasting, qibla, duas, Hajj, halal food or Quran recitation.',
  };
}

export const topics = KB.map((k) => k.id);
