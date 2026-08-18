import type { ChatIntent, ChatSourceType } from '../types.js';
import { tokenize } from './scoring.js';

/**
 * Trilingual keyword routing.
 *
 * This is what makes cross-language retrieval work at all. Term overlap alone
 * fails when a farmer asks in English and the only matching record is stored in
 * Afaan Oromo — no shared tokens. Routing by topic pulls the category-relevant
 * records regardless of the language they are written in, and scoring then ranks
 * within that set.
 *
 * Extends the keyword lists that were inlined in the old chatService stub
 * (crop / livestock / market / pest / irrigation / contact) and adds the topics
 * that stub never covered.
 */
const TOPIC_KEYWORDS: { sourceTypes: ChatSourceType[]; keywords: string[] }[] = [
  {
    sourceTypes: ['marketPrice', 'news'],
    keywords: [
      'market', 'price', 'prices', 'cost', 'sell', 'selling', 'buy', 'quintal',
      'gabaa', 'gatii', 'kuntala', 'gurgurtaa', 'bittaa',
      'ገበያ', 'ዋጋ', 'ኩንታል', 'መሸጥ', 'ግዢ',
    ],
  },
  {
    sourceTypes: ['office', 'service'],
    keywords: [
      'contact', 'office', 'phone', 'call', 'address', 'hotline', 'email', 'where',
      'waajjira', 'bilbila', 'teessoo', 'sarara', 'eessa', 'qunnamtii',
      'ጽሕፈት', 'ስልክ', 'አድራሻ', 'ደውል', 'የት', 'መገናኛ',
    ],
  },
  {
    sourceTypes: ['alert', 'news'],
    keywords: [
      'pest', 'disease', 'outbreak', 'worm', 'armyworm', 'locust', 'rust', 'alert', 'warning',
      'awaannisa', 'dhukkuba', 'raammoo', 'beeksisa', 'akeekkachiisa', 'hoomaa',
      'ተባይ', 'በሽታ', 'ማስጠንቀቂያ', 'አንበጣ', 'ትል',
    ],
  },
  {
    sourceTypes: ['alert', 'service', 'program'],
    keywords: [
      'irrigation', 'water', 'weather', 'rain', 'drought', 'flood', 'pump',
      'jallisii', 'bishaan', 'rooba', 'hongee', 'lolaa', 'haala',
      'መስኖ', 'ውሃ', 'የአየር', 'ዝናብ', 'ድርቅ', 'ጎርፍ',
    ],
  },
  {
    sourceTypes: ['service', 'program', 'publication', 'news'],
    keywords: [
      'crop', 'seed', 'fertilizer', 'wheat', 'teff', 'maize', 'barley', 'harvest', 'plant', 'sow',
      'midhaan', 'sanyii', 'xaaoo', 'qamadii', 'boqqolloo', 'garbuu', 'facaasuu', 'oomisha',
      'ሰብል', 'ዘር', 'ማዳበሪያ', 'ስንዴ', 'ጤፍ', 'በቆሎ', 'ገብስ', 'ምርት',
    ],
  },
  {
    sourceTypes: ['service', 'program', 'alert'],
    keywords: [
      'livestock', 'cattle', 'cow', 'goat', 'sheep', 'poultry', 'vaccination', 'vaccine', 'animal', 'dairy',
      'beeyladaa', 'loon', 'reeoo', 'hoolaa', 'lukkuu', 'talaallii', 'aannan',
      'እንስሳት', 'ከብት', 'ላም', 'ፍየል', 'በግ', 'ዶሮ', 'ክትባት', 'ወተት',
    ],
  },
  {
    sourceTypes: ['publication', 'service'],
    keywords: [
      'guide', 'manual', 'document', 'download', 'form', 'calendar', 'training', 'learn',
      'qajeelfama', 'barreeffama', 'buufachuu', 'leenjii', 'kaalaandarii',
      'መመሪያ', 'ሰነድ', 'ማውረድ', 'ስልጠና', 'ቀን መቁጠሪያ',
    ],
  },
  {
    sourceTypes: ['investment', 'program'],
    keywords: [
      'invest', 'investment', 'investor', 'opportunity', 'land', 'zone', 'business',
      'invastimantii', 'carraa', 'lafa', 'godina', 'daldala',
      'ኢንቨስትመንት', 'ባለሀብት', 'እድል', 'መሬት', 'ዞን', 'ንግድ',
    ],
  },
  {
    sourceTypes: ['achievement', 'news'],
    keywords: [
      'achievement', 'result', 'progress', 'impact', 'success', 'report',
      'milkaaina', 'buaa', 'guddina', 'gabaasa',
      'ስኬት', 'ውጤት', 'እድገት', 'ሪፖርት',
    ],
  },
  {
    sourceTypes: ['news', 'alert'],
    keywords: [
      'news', 'announcement', 'update', 'tender', 'vacancy', 'event', 'latest',
      'oduu', 'beeksisa', 'haaraa', 'caalbaasii', 'taatee',
      'ዜና', 'ማስታወቂያ', 'አዲስ', 'ጨረታ', 'ክስተት',
    ],
  },
];

const ALL_SOURCE_TYPES: ChatSourceType[] = [
  'news', 'alert', 'achievement', 'investment',
  'marketPrice', 'office', 'service', 'program', 'publication',
];

/**
 * Route a question to the content types most likely to answer it.
 * Falls back to searching everything when no topic keyword matches, so an
 * unanticipated phrasing degrades to a broad search rather than to nothing.
 */
export function classifyIntent(query: string): ChatIntent {
  const tokens = tokenize(query);
  const haystack = ` ${(query || '').toLowerCase()} `;
  const matched = new Set<ChatSourceType>();

  for (const topic of TOPIC_KEYWORDS) {
    const hit = topic.keywords.some(
      (keyword) => haystack.includes(keyword) || tokens.includes(keyword)
    );
    if (hit) topic.sourceTypes.forEach((type) => matched.add(type));
  }

  return {
    sourceTypes: matched.size > 0 ? [...matched] : [...ALL_SOURCE_TYPES],
    tokens,
  };
}
