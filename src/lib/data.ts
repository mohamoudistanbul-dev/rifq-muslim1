/**
 * Curated content shipped with the app.
 *
 * Rules followed here:
 *  - Quranic text is quoted verbatim with its surah:ayah reference.
 *  - Prophetic duas carry the collection and number they are reported in.
 *  - Nothing is generated: if a reference is not known, the field is omitted.
 */

export interface Dua {
  id: string;
  category: DuaCategory;
  title: string;
  titleAr: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
}

export type DuaCategory =
  | 'morning'
  | 'evening'
  | 'sleep'
  | 'waking'
  | 'home'
  | 'mosque'
  | 'eating'
  | 'travel'
  | 'protection'
  | 'forgiveness'
  | 'dhikr';

export const DUA_CATEGORIES: { id: DuaCategory; label: string; labelAr: string; icon: string }[] = [
  { id: 'morning', label: 'Morning Adhkar', labelAr: 'أذكار الصباح', icon: 'sun' },
  { id: 'evening', label: 'Evening Adhkar', labelAr: 'أذكار المساء', icon: 'moon' },
  { id: 'sleep', label: 'Before sleeping', labelAr: 'قبل النوم', icon: 'moon' },
  { id: 'waking', label: 'After waking', labelAr: 'عند الاستيقاظ', icon: 'sun' },
  { id: 'home', label: 'Home', labelAr: 'المنزل', icon: 'home' },
  { id: 'mosque', label: 'Mosque', labelAr: 'المسجد', icon: 'mosque' },
  { id: 'eating', label: 'Eating & drinking', labelAr: 'الطعام والشراب', icon: 'star' },
  { id: 'travel', label: 'Travel', labelAr: 'السفر', icon: 'compass' },
  { id: 'protection', label: 'Protection', labelAr: 'الحماية', icon: 'shield' },
  { id: 'forgiveness', label: 'Forgiveness', labelAr: 'الاستغفار', icon: 'heart' },
  { id: 'dhikr', label: 'Daily Dhikr', labelAr: 'الذكر اليومي', icon: 'beads' },
];

export const DUAS: Dua[] = [
  {
    id: 'morning-1',
    category: 'morning',
    title: 'Morning: the kingdom belongs to Allah',
    titleAr: 'أصبحنا وأصبح الملك لله',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah',
    translation:
      'We have entered the morning and the dominion belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone, without partner.',
    reference: 'Sahih Muslim 2723',
  },
  {
    id: 'evening-1',
    category: 'evening',
    title: 'Evening: the kingdom belongs to Allah',
    titleAr: 'أمسينا وأمسى الملك لله',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'Amsayna wa amsal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah',
    translation:
      'We have entered the evening and the dominion belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone, without partner.',
    reference: 'Sahih Muslim 2723',
  },
  {
    id: 'forgive-1',
    category: 'forgiveness',
    title: 'Sayyid al-Istighfar',
    titleAr: 'سيد الاستغفار',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration:
      'Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana abduk, wa ana ala ahdika wa wadika mastata\'t...',
    translation:
      'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant. I keep Your covenant and promise as much as I can. I seek refuge in You from the evil I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins but You.',
    reference: 'Sahih al-Bukhari 6306',
  },
  {
    id: 'sleep-1',
    category: 'sleep',
    title: 'Before sleeping',
    titleAr: 'قبل النوم',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amutu wa ahya',
    translation: 'In Your name, O Allah, I die and I live.',
    reference: 'Sahih al-Bukhari 6324',
  },
  {
    id: 'waking-1',
    category: 'waking',
    title: 'On waking',
    titleAr: 'عند الاستيقاظ',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: 'Alhamdu lillahil-ladhi ahyana bada ma amatana wa ilayhin-nushur',
    translation:
      'All praise is for Allah who gave us life after He had caused us to die, and to Him is the return.',
    reference: 'Sahih al-Bukhari 6312',
  },
  {
    id: 'home-1',
    category: 'home',
    title: 'Entering the home',
    titleAr: 'دعاء دخول المنزل',
    arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    transliteration: 'Bismillahi walajna, wa bismillahi kharajna, wa ala rabbina tawakkalna',
    translation:
      'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we depend.',
    reference: 'Sunan Abi Dawud 5096',
  },
  {
    id: 'home-2',
    category: 'home',
    title: 'Leaving the home',
    titleAr: 'دعاء الخروج من المنزل',
    arabic: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'Bismillah, tawakkaltu alallah, wa la hawla wa la quwwata illa billah',
    translation:
      'In the name of Allah, I place my trust in Allah; there is no might and no power except with Allah.',
    reference: 'Sunan Abi Dawud 5095; Jami at-Tirmidhi 3426',
  },
  {
    id: 'mosque-1',
    category: 'mosque',
    title: 'Entering the mosque',
    titleAr: 'دعاء دخول المسجد',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahumma iftah li abwaba rahmatik',
    translation: 'O Allah, open the gates of Your mercy for me.',
    reference: 'Sahih Muslim 713',
  },
  {
    id: 'mosque-2',
    category: 'mosque',
    title: 'Leaving the mosque',
    titleAr: 'دعاء الخروج من المسجد',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: 'Allahumma inni as\'aluka min fadlik',
    translation: 'O Allah, I ask You from Your bounty.',
    reference: 'Sahih Muslim 713',
  },
  {
    id: 'eating-1',
    category: 'eating',
    title: 'Before eating',
    titleAr: 'قبل الطعام',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    translation: 'In the name of Allah.',
    reference: 'Sunan Abi Dawud 3767',
  },
  {
    id: 'eating-2',
    category: 'eating',
    title: 'After eating',
    titleAr: 'بعد الطعام',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
    transliteration: 'Alhamdu lillahil-ladhi at\'amana wa saqana wa ja\'alana muslimin',
    translation:
      'All praise is for Allah who fed us, gave us drink and made us Muslims.',
    reference: 'Jami at-Tirmidhi 3457',
  },
  {
    id: 'travel-1',
    category: 'travel',
    title: 'Setting out on a journey',
    titleAr: 'دعاء السفر',
    arabic:
      'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: 'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun',
    translation:
      'Glory to Him who has subjected this to us, though we could never have subdued it, and truly to our Lord we shall return.',
    reference: 'Quran 43:13-14; Sahih Muslim 1342',
  },
  {
    id: 'protect-1',
    category: 'protection',
    title: 'Seeking refuge from all harm',
    titleAr: 'التعوذ من شر المخلوقات',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: 'A\'udhu bikalimatillahit-tammati min sharri ma khalaq',
    translation: 'I seek refuge in the perfect words of Allah from the evil of what He created.',
    reference: 'Sahih Muslim 2709',
  },
  {
    id: 'forgive-2',
    category: 'forgiveness',
    title: 'Asking forgiveness',
    titleAr: 'الاستغفار',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullaha wa atubu ilayh',
    translation: 'I seek the forgiveness of Allah and turn to Him in repentance.',
    reference: 'Sahih al-Bukhari 6307',
  },
  {
    id: 'dhikr-1',
    category: 'dhikr',
    title: 'The two light phrases',
    titleAr: 'التسبيح',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: 'Subhanallahi wa bihamdih, subhanallahil-\'azim',
    translation:
      'Glory is to Allah and praise is to Him; glory is to Allah, the Magnificent.',
    reference: 'Sahih al-Bukhari 6406; Sahih Muslim 2694',
  },
  {
    id: 'dhikr-2',
    category: 'dhikr',
    title: 'Tahleel',
    titleAr: 'التهليل',
    arabic:
      'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa ala kulli shay\'in qadir',
    translation:
      'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is able to do all things.',
    reference: 'Sahih al-Bukhari 6403',
  },
  {
    id: 'quran-1',
    category: 'dhikr',
    title: 'Good in both worlds',
    titleAr: 'دعاء القرآن',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhaban-nar',
    translation:
      'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    reference: 'Quran 2:201',
  },
  {
    id: 'quran-2',
    category: 'protection',
    title: 'Expansion of the chest',
    titleAr: 'دعاء موسى عليه السلام',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    transliteration: 'Rabbish-rah li sadri wa yassir li amri',
    translation: 'My Lord, expand for me my chest and ease for me my task.',
    reference: 'Quran 20:25-26',
  },
  {
    id: 'quran-3',
    category: 'protection',
    title: 'Steadfastness of heart',
    titleAr: 'دعاء الثبات',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ',
    transliteration: 'Rabbana la tuzigh qulubana ba\'da idh hadaytana wa hab lana min ladunka rahmatan innaka antal-wahhab',
    translation:
      'Our Lord, let not our hearts deviate after You have guided us, and grant us mercy from Yourself; indeed You are the Bestower.',
    reference: 'Quran 3:8',
  },
];

export const TASBIH_PRESETS = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', latin: 'SubhanAllah', target: 33 },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', latin: 'Alhamdulillah', target: 33 },
  { id: 'allahuakbar', arabic: 'اللَّهُ أَكْبَرُ', latin: 'Allahu Akbar', target: 34 },
  { id: 'tahlil', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', latin: 'La ilaha illa Allah', target: 100 },
  { id: 'istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ', latin: 'Astaghfirullah', target: 100 },
  { id: 'salawat', arabic: 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ', latin: 'Salawat', target: 100 },
];

export interface QuizQuestion {
  id: string;
  category: 'quran' | 'hadith' | 'prophets' | 'history' | 'worship';
  level: 1 | 2 | 3;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  reference: string;
}

export const QUIZ: QuizQuestion[] = [
  { id: 'q1', category: 'quran', level: 1, question: 'How many surahs are in the Quran?', options: ['100', '110', '114', '120'], answer: 2, explanation: 'The Quran has 114 surahs.', reference: 'Quran, standard arrangement' },
  { id: 'q2', category: 'quran', level: 1, question: 'Which is the longest surah of the Quran?', options: ['Al-Fatihah', 'Al-Baqarah', 'An-Nisa', 'Al-Kahf'], answer: 1, explanation: 'Surah Al-Baqarah has 286 verses.', reference: 'Quran 2' },
  { id: 'q3', category: 'quran', level: 1, question: 'Which surah is called the Mother of the Book?', options: ['Al-Fatihah', 'Al-Ikhlas', 'Yasin', 'Al-Mulk'], answer: 0, explanation: 'Al-Fatihah opens the Quran and is recited in every prayer.', reference: 'Quran 1' },
  { id: 'q4', category: 'quran', level: 2, question: 'Which surah was revealed first?', options: ['Al-Fatihah', 'Al-Alaq', 'Al-Muddaththir', 'Al-Baqarah'], answer: 1, explanation: 'The first revelation was the beginning of Surah Al-Alaq.', reference: 'Quran 96:1-5; Sahih al-Bukhari 3' },
  { id: 'q5', category: 'quran', level: 2, question: 'Which surah mentions the story of the People of the Cave?', options: ['Al-Kahf', 'Maryam', 'Yusuf', 'Hud'], answer: 0, explanation: 'The story of the companions of the cave is in Surah Al-Kahf.', reference: 'Quran 18:9-26' },
  { id: 'q6', category: 'quran', level: 2, question: 'How many verses are in Surah Al-Ikhlas?', options: ['3', '4', '5', '6'], answer: 1, explanation: 'Surah Al-Ikhlas has four verses.', reference: 'Quran 112' },
  { id: 'q7', category: 'quran', level: 3, question: 'Which surah is the only one named after a woman?', options: ['Maryam', 'An-Nisa', 'Al-Mujadilah', 'Al-Mumtahanah'], answer: 0, explanation: 'Surah Maryam is named after Maryam (Mary), mother of Isa.', reference: 'Quran 19' },
  { id: 'q8', category: 'quran', level: 3, question: 'Which surah does not begin with Bismillah?', options: ['Al-Fatihah', 'At-Tawbah', 'An-Naml', 'Yasin'], answer: 1, explanation: 'Surah At-Tawbah is the only surah that does not open with the Basmalah.', reference: 'Quran 9' },
  { id: 'q9', category: 'hadith', level: 1, question: 'Which collection is regarded as the most authentic after the Quran?', options: ['Sahih al-Bukhari', 'Sunan Ibn Majah', 'Muwatta Malik', 'Musnad Ahmad'], answer: 0, explanation: 'Sahih al-Bukhari is widely regarded as the most authentic hadith collection.', reference: 'Sahih al-Bukhari' },
  { id: 'q10', category: 'hadith', level: 1, question: 'A hadith whose chain is strong and free of defects is called:', options: ['Da\'if', 'Sahih', 'Mawdu\'', 'Mursal'], answer: 1, explanation: 'Sahih means authentic: a connected, reliable chain without irregularity.', reference: 'Hadith terminology' },
  { id: 'q11', category: 'hadith', level: 2, question: 'Complete the hadith: "Actions are judged by..."', options: ['their outcome', 'intentions', 'their number', 'the time'], answer: 1, explanation: 'The hadith begins: "Actions are but by intentions."', reference: 'Sahih al-Bukhari 1; Sahih Muslim 1907' },
  { id: 'q12', category: 'hadith', level: 2, question: 'Which book is a collection of forty hadith compiled by Imam an-Nawawi?', options: ['Riyad as-Salihin', 'Al-Arba\'un an-Nawawiyyah', 'Al-Muwatta', 'Bulugh al-Maram'], answer: 1, explanation: 'Al-Arba\'un an-Nawawiyyah is a famous collection of forty hadith.', reference: 'Al-Arba\'un an-Nawawiyyah' },
  { id: 'q13', category: 'hadith', level: 3, question: 'What does "mutawatir" describe?', options: ['A hadith narrated by many at every level', 'A hadith with one narrator', 'A hadith with a missing link', 'A hadith about worship'], answer: 0, explanation: 'Mutawatir reports are transmitted by numerous narrators at every level.', reference: 'Hadith terminology' },
  { id: 'q14', category: 'prophets', level: 1, question: 'Who was the first prophet?', options: ['Nuh', 'Adam', 'Ibrahim', 'Musa'], answer: 1, explanation: 'Adam was the first human and the first prophet.', reference: 'Quran 2:30-37' },
  { id: 'q15', category: 'prophets', level: 1, question: 'Who built the Kaaba with his son Ismail?', options: ['Musa', 'Ibrahim', 'Dawud', 'Yaqub'], answer: 1, explanation: 'Ibrahim and Ismail raised the foundations of the Kaaba.', reference: 'Quran 2:127' },
  { id: 'q16', category: 'prophets', level: 2, question: 'Which prophet was given the Zabur?', options: ['Dawud', 'Musa', 'Isa', 'Sulayman'], answer: 0, explanation: 'Allah gave Dawud the Zabur.', reference: 'Quran 4:163; 17:55' },
  { id: 'q17', category: 'prophets', level: 2, question: 'Which prophet is called Kalimullah (the one Allah spoke to)?', options: ['Isa', 'Musa', 'Harun', 'Yusuf'], answer: 1, explanation: 'Musa is known as Kalimullah.', reference: 'Quran 4:164' },
  { id: 'q18', category: 'prophets', level: 3, question: 'Which prophet was given the Injil?', options: ['Isa', 'Yahya', 'Zakariyya', 'Ilyas'], answer: 0, explanation: 'Allah gave Isa the Injil.', reference: 'Quran 5:46' },
  { id: 'q19', category: 'history', level: 1, question: 'In which city did the Prophet Muhammad ﷺ receive the first revelation?', options: ['Madinah', 'Makkah', 'Taif', 'Jerusalem'], answer: 1, explanation: 'The first revelation came in the cave of Hira near Makkah.', reference: 'Sahih al-Bukhari 3' },
  { id: 'q20', category: 'history', level: 1, question: 'In which year of the Hijri calendar did the Prophet ﷺ migrate to Madinah?', options: ['Year 1', 'Year 5', 'Year 10', 'Year 13'], answer: 0, explanation: 'The Hijri calendar begins with the migration (hijrah).', reference: 'Islamic history' },
  { id: 'q21', category: 'history', level: 2, question: 'How many years did the Prophet ﷺ receive revelation in Makkah before the hijrah?', options: ['3', '10', '13', '20'], answer: 2, explanation: 'The Makkan period of prophethood lasted about thirteen years.', reference: 'Islamic history' },
  { id: 'q22', category: 'history', level: 3, question: 'Which treaty was concluded between the Muslims and Quraysh in 6 AH?', options: ['Treaty of Hudaybiyyah', 'Pledge of Aqabah', 'Treaty of Tabuk', 'Pact of Madinah'], answer: 0, explanation: 'The Treaty of Hudaybiyyah was concluded in 6 AH.', reference: 'Islamic history' },
  { id: 'q23', category: 'worship', level: 1, question: 'How many times a day are the obligatory prayers?', options: ['3', '5', '6', '7'], answer: 1, explanation: 'Five daily prayers are obligatory.', reference: 'Sahih al-Bukhari 8' },
  { id: 'q24', category: 'worship', level: 1, question: 'Which prayer is performed just before dawn?', options: ['Isha', 'Fajr', 'Asr', 'Maghrib'], answer: 1, explanation: 'Fajr is the pre-dawn prayer.', reference: 'Quran 17:78' },
  { id: 'q25', category: 'worship', level: 2, question: 'What percentage of eligible wealth is paid as Zakat?', options: ['2.5%', '5%', '10%', '1%'], answer: 0, explanation: 'Zakat on most wealth is one fortieth (2.5%).', reference: 'Sahih al-Bukhari 1454' },
  { id: 'q26', category: 'worship', level: 2, question: 'How many times does a pilgrim circle the Kaaba during Tawaf?', options: ['3', '5', '7', '9'], answer: 2, explanation: 'Tawaf consists of seven circuits.', reference: 'Hajj rites' },
  { id: 'q27', category: 'worship', level: 3, question: 'What is the minimum nisab for Zakat on gold (by weight)?', options: ['About 85 grams', 'About 10 grams', 'About 500 grams', 'About 1 kilogram'], answer: 0, explanation: 'The nisab for gold is 20 dinars, approximately 85 grams.', reference: 'Fiqh of Zakat' },
  { id: 'q28', category: 'worship', level: 3, question: 'Which month is fasting obligatory?', options: ['Sha\'ban', 'Ramadan', 'Muharram', 'Rajab'], answer: 1, explanation: 'Fasting the month of Ramadan is obligatory.', reference: 'Quran 2:185' },
];

export const REMINDERS: { text: string; reference: string }[] = [
  { text: 'Whoever prays Fajr in congregation is under the protection of Allah.', reference: 'Sahih Muslim 657' },
  { text: 'The most beloved deeds to Allah are those done consistently, even if small.', reference: 'Sahih al-Bukhari 6464' },
  { text: 'Make things easy and do not make them difficult; give glad tidings and do not repel people.', reference: 'Sahih al-Bukhari 69' },
  { text: 'None of you truly believes until he loves for his brother what he loves for himself.', reference: 'Sahih al-Bukhari 13' },
  { text: 'The strong person is not the one who overcomes people, but the one who controls himself when angry.', reference: 'Sahih al-Bukhari 6114' },
  { text: 'A good word is charity.', reference: 'Sahih al-Bukhari 2989' },
  { text: 'Allah does not look at your appearance or wealth, but at your hearts and deeds.', reference: 'Sahih Muslim 2564' },
  { text: 'Whoever believes in Allah and the Last Day should speak good or remain silent.', reference: 'Sahih al-Bukhari 6018' },
  { text: 'The best of you are those who are best to their families.', reference: 'Jami at-Tirmidhi 3895' },
  { text: 'Removing something harmful from the road is an act of charity.', reference: 'Sahih al-Bukhari 2989' },
  { text: 'Allah is gentle and loves gentleness in all affairs.', reference: 'Sahih Muslim 2593' },
  { text: 'Smiling in the face of your brother is charity.', reference: 'Jami at-Tirmidhi 1956' },
  { text: 'He who does not thank people does not thank Allah.', reference: 'Sunan Abi Dawud 4811' },
  { text: 'The best wealth is a tongue that remembers Allah and a grateful heart.', reference: 'Jami at-Tirmidhi 3506' },
  { text: 'Cleanliness is half of faith.', reference: 'Sahih Muslim 223' },
  { text: 'Whoever reads a letter from the Book of Allah receives a reward, and it is multiplied tenfold.', reference: 'Jami at-Tirmidhi 2910' },
  { text: 'Do not belittle any good deed, even meeting your brother with a cheerful face.', reference: 'Sahih Muslim 2626' },
  { text: 'The believer who mixes with people and bears their harm patiently is better than one who does not.', reference: 'Sunan Ibn Majah 4032' },
  { text: 'Whoever covers the faults of a Muslim, Allah will cover his faults.', reference: 'Sahih Muslim 2699' },
  { text: 'The most complete believer in faith is the best in character.', reference: 'Jami at-Tirmidhi 1162' },
];

export interface Step {
  title: string;
  detail: string;
  requirement: 'required' | 'recommended' | 'optional';
}

export const UMRAH_STEPS: Step[] = [
  { title: 'Enter ihram', detail: 'Perform ghusl, wear the garments of ihram, and make the intention (niyyah) for Umrah at or before the miqat.', requirement: 'required' },
  { title: 'Talbiyah', detail: 'Recite "Labbayk Allahumma labbayk..." continuously until you begin Tawaf.', requirement: 'recommended' },
  { title: 'Tawaf', detail: 'Enter the Masjid al-Haram and circumambulate the Kaaba seven times, beginning at the Black Stone, keeping it on your left.', requirement: 'required' },
  { title: 'Two rak\u2019ahs', detail: 'Pray two units of prayer behind Maqam Ibrahim if possible, or anywhere in the mosque.', requirement: 'recommended' },
  { title: 'Zamzam', detail: 'Drink Zamzam water.', requirement: 'recommended' },
  { title: 'Sa\u2019i', detail: 'Walk seven times between Safa and Marwah, beginning at Safa and ending at Marwah.', requirement: 'required' },
  { title: 'Halq or taqsir', detail: 'Men shave the head (halq) or trim (taqsir); women trim a fingertip length of hair.', requirement: 'required' },
  { title: 'Completion', detail: 'The Umrah is complete and ihram restrictions end.', requirement: 'required' },
];

export const HAJJ_STEPS: Step[] = [
  { title: '8 Dhu al-Hijjah \u2013 Mina', detail: 'Enter ihram for Hajj and travel to Mina, praying Dhuhr, Asr, Maghrib, Isha and the next Fajr there.', requirement: 'recommended' },
  { title: '9 Dhu al-Hijjah \u2013 Arafah', detail: 'The essential rite: stand at Arafah from Dhuhr until sunset in supplication. Whoever misses it has missed Hajj.', requirement: 'required' },
  { title: 'Muzdalifah', detail: 'After sunset, move to Muzdalifah, pray Maghrib and Isha, rest, and pray Fajr.', requirement: 'required' },
  { title: '10 Dhu al-Hijjah \u2013 Mina', detail: 'Return to Mina, stone Jamarat al-Aqabah with seven pebbles, then sacrifice (hady) if applicable.', requirement: 'required' },
  { title: 'Halq or taqsir', detail: 'Shave or trim the hair, removing the restrictions of ihram except marital relations.', requirement: 'required' },
  { title: 'Tawaf al-Ifadah', detail: 'Perform the obligatory Tawaf of Hajj with seven circuits and Sa\u2019i where required.', requirement: 'required' },
  { title: 'Days of Tashriq (11\u201313)', detail: 'Stay in Mina and stone all three Jamarat after Dhuhr each day.', requirement: 'required' },
  { title: 'Tawaf al-Wada', detail: 'The farewell Tawaf before leaving Makkah.', requirement: 'required' },
];

export const HAJJ_CHECKLIST = [
  'Valid passport and Hajj/Umrah visa',
  'Ihram garments (two white sheets for men)',
  'Comfortable walking sandals',
  'Unscented soap and toiletries',
  'Medication and a small first-aid kit',
  'Reusable water bottle',
  'Prayer mat and pocket Quran/Dua book',
  'Phone charger and power bank',
  'Photocopies of documents',
  'Written contact details of your group leader',
];

export const ARABIC_LETTERS = [
  { letter: 'ا', name: 'Alif' }, { letter: 'ب', name: 'Ba' }, { letter: 'ت', name: 'Ta' },
  { letter: 'ث', name: 'Tha' }, { letter: 'ج', name: 'Jeem' }, { letter: 'ح', name: 'Haa' },
  { letter: 'خ', name: 'Kha' }, { letter: 'د', name: 'Dal' }, { letter: 'ذ', name: 'Dhal' },
  { letter: 'ر', name: 'Ra' }, { letter: 'ز', name: 'Zay' }, { letter: 'س', name: 'Seen' },
  { letter: 'ش', name: 'Sheen' }, { letter: 'ص', name: 'Sad' }, { letter: 'ض', name: 'Dad' },
  { letter: 'ط', name: 'Ta (heavy)' }, { letter: 'ظ', name: 'Zha' }, { letter: 'ع', name: 'Ayn' },
  { letter: 'غ', name: 'Ghayn' }, { letter: 'ف', name: 'Fa' }, { letter: 'ق', name: 'Qaf' },
  { letter: 'ك', name: 'Kaf' }, { letter: 'ل', name: 'Lam' }, { letter: 'م', name: 'Meem' },
  { letter: 'ن', name: 'Noon' }, { letter: 'ه', name: 'Ha' }, { letter: 'و', name: 'Waw' },
  { letter: 'ي', name: 'Ya' },
];

export const MANNERS = [
  { title: 'Saying Bismillah', detail: 'Begin eating, drinking and good actions with the name of Allah.' },
  { title: 'Greeting with salam', detail: 'Spread the greeting of peace: "As-salamu alaykum".' },
  { title: 'Honouring parents', detail: 'Speak to your parents gently and help them with joy.' },
  { title: 'Truthfulness', detail: 'Always tell the truth, even when it is difficult.' },
  { title: 'Sharing', detail: 'Share your food and toys with others and earn reward.' },
  { title: 'Respecting elders', detail: 'Stand up for elders, listen to them and speak kindly.' },
  { title: 'Cleanliness', detail: 'Keep your body, clothes and room clean; cleanliness is half of faith.' },
  { title: 'Kindness to animals', detail: 'Give animals water and food and never harm them.' },
  { title: 'Controlling anger', detail: 'When you feel angry, stay silent and remember Allah.' },
  { title: 'Thanking others', detail: 'Say "Jazakallahu khayran" to those who help you.' },
];

export const PROPHETS = [
  { name: 'Adam', arabic: 'آدم', note: 'The first human and first prophet, created by Allah and taught the names of things.' },
  { name: 'Nuh', arabic: 'نوح', note: 'Called his people to Allah for a very long time and built the ark by Allah\u2019s command.' },
  { name: 'Ibrahim', arabic: 'إبراهيم', note: 'The friend of Allah, who rejected idolatry and rebuilt the Kaaba with his son Ismail.' },
  { name: 'Yusuf', arabic: 'يوسف', note: 'Known for beautiful patience; his story is told in Surah Yusuf.' },
  { name: 'Musa', arabic: 'موسى', note: 'Spoke with Allah and was sent to Pharaoh with clear signs.' },
  { name: 'Dawud', arabic: 'داود', note: 'A prophet and king given the Zabur; known for his worship and justice.' },
  { name: 'Sulayman', arabic: 'سليمان', note: 'A prophet and king given a great kingdom and understanding.' },
  { name: 'Isa', arabic: 'عيسى', note: 'The son of Maryam, given the Injil, who called his people to worship Allah alone.' },
  { name: 'Yunus', arabic: 'يونس', note: 'Called his people to Allah and was saved in the belly of the whale after his supplication.' },
  { name: 'Muhammad \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645', arabic: 'محمد', note: 'The final Messenger, sent as a mercy to the worlds; the Quran was revealed to him.' },
];

export const SHORT_SURAHS = [
  { number: 1, name: 'Al-Fatihah', arabic: 'الفاتحة', verses: 7 },
  { number: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص', verses: 4 },
  { number: 113, name: 'Al-Falaq', arabic: 'الفلق', verses: 5 },
  { number: 114, name: 'An-Nas', arabic: 'الناس', verses: 6 },
  { number: 108, name: 'Al-Kawthar', arabic: 'الكوثر', verses: 3 },
  { number: 103, name: 'Al-Asr', arabic: 'العصر', verses: 3 },
  { number: 110, name: 'An-Nasr', arabic: 'النصر', verses: 3 },
  { number: 105, name: 'Al-Fil', arabic: 'الفيل', verses: 5 },
  { number: 106, name: 'Quraysh', arabic: 'قريش', verses: 4 },
  { number: 107, name: 'Al-Ma\u2019un', arabic: 'الماعون', verses: 7 },
  { number: 109, name: 'Al-Kafirun', arabic: 'الكافرون', verses: 6 },
  { number: 111, name: 'Al-Masad', arabic: 'المسد', verses: 5 },
];

export const GOOD_DEEDS = [
  { id: 'salah', label: 'Five prayers on time' },
  { id: 'quran', label: 'Read Quran' },
  { id: 'dhikr', label: 'Morning & evening adhkar' },
  { id: 'sadaqah', label: 'Give charity' },
  { id: 'parents', label: 'Call or help parents' },
  { id: 'salam', label: 'Greet someone with salam' },
  { id: 'smile', label: 'Smile and be kind' },
  { id: 'istighfar', label: 'Seek forgiveness 100 times' },
];

export const DAILY_CHALLENGES = [
  'Read one page of the Quran after Fajr.',
  'Give a small charity today, even a date.',
  'Learn one new dua and use it.',
  'Call a relative you have not spoken to this week.',
  'Pray one prayer in congregation.',
  'Send salawat upon the Prophet \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645 ten times.',
  'Forgive someone who upset you.',
  'Teach a child one Arabic letter or one short surah.',
  'Make dua for the whole Ummah.',
  'Avoid complaining for one full day.',
];

export function dayIndex(date = new Date(), mod: number): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start;
  const day = Math.floor(diff / 86400000);
  return mod > 0 ? day % mod : day;
}
