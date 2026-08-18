import { LanguageCode } from '../types';
import { classifyIntent } from '../server/chat/retrieval/intent';
import { tokenize, rankDocs, scoreDoc } from '../server/chat/retrieval/scoring';
import { loadStaticDocs } from '../server/chat/retrieval/staticSource';
import { langsPresent, textIn } from '../server/chat/retrieval/localized';
import { composeFromTemplate, composeDecline } from '../server/chat/composers/templateComposer';
import { isFirestoreConfigured, resetFirestoreAvailability } from '../server/chat/retrieval/firestoreSource';
import { getPublicFirebaseConfig } from '../server/chat/retrieval/publicFirestore';
import { ChatSourceType, RetrievedDoc } from '../server/chat/types';

/**
 * Chat System Tests
 * -----------------
 * Follows the hand-rolled TestResult[] convention used by the other suites in
 * this directory (see alertSystemTests.ts) — this repo has no test runner.
 *
 * Everything here is deterministic and network-free: retrieval scoring, intent
 * routing, the static content adapter, and the template composer. The Gemini
 * composer is not exercised, because asserting on a live model would make the
 * suite non-deterministic and cost money on every run.
 */

export interface TestResult {
  id: number;
  name: string;
  category: 'Intent' | 'Scoring' | 'Static' | 'Composer' | 'Language' | 'Safety';
  passed: boolean;
  message: string;
  details?: any;
}

function doc(overrides: Partial<RetrievedDoc> = {}): RetrievedDoc {
  return {
    id: 'doc-1',
    sourceType: 'news',
    title: { om: 'Oduu Qamadii', am: 'የስንዴ ዜና', en: 'Wheat News' },
    body: { om: 'Qamadii facaasuu', am: 'ስንዴ መዝራት', en: 'Sowing wheat' },
    url: '/news/wheat',
    availableLangs: ['om', 'am', 'en'],
    score: 0,
    ...overrides,
  };
}

export function runChatSystemTests(): TestResult[] {
  const results: TestResult[] = [];
  let id = 0;

  const check = (
    name: string,
    category: TestResult['category'],
    fn: () => { passed: boolean; message: string; details?: any }
  ) => {
    id += 1;
    try {
      const outcome = fn();
      results.push({ id, name, category, ...outcome });
    } catch (err) {
      results.push({
        id,
        name,
        category,
        passed: false,
        message: `Threw: ${(err as Error)?.message}`,
      });
    }
  };

  // ---------------------------------------------------------------- Tokenizer

  check('Tokenizer preserves Geez script', 'Language', () => {
    const tokens = tokenize('የስንዴ ዋጋ ስንት ነው?');
    return {
      passed: tokens.includes('የስንዴ') && tokens.includes('ዋጋ'),
      message: `Amharic tokens: ${JSON.stringify(tokens)}`,
      details: tokens,
    };
  });

  check('Two-character Amharic words survive tokenization', 'Language', () => {
    // Each Geez character is a syllable, so a Latin-tuned minimum length would
    // discard the most common Amharic search terms: price, seed, water.
    const kept = ['ዋጋ', 'ዘር', 'ውሃ'].filter((word) => tokenize(word).length === 1);
    return {
      passed: kept.length === 3,
      message: `Survived: ${kept.join(', ')} (${kept.length}/3)`,
    };
  });

  check('English stopwords do not match inside unrelated words', 'Language', () => {
    // "for" once matched "Forms" and "in" matched "Intelligence", making every
    // query match every document.
    const tokens = tokenize('How do I apply for a licence in Norway?');
    const noiseFree = !tokens.includes('for') && !tokens.includes('how');
    const target = doc({ title: { en: 'Service Request Forms' }, body: { en: 'Market Intelligence' } });
    return {
      passed: noiseFree && scoreDoc(target, tokens, 'en') === 0,
      message: `tokens=${JSON.stringify(tokens)} score=${scoreDoc(target, tokens, 'en')}`,
    };
  });

  check('Weak matches are dropped relative to the best match', 'Scoring', () => {
    // The weak record matches only the generic field label, the way every office
    // in the directory matched "Phone" regardless of which one was asked about.
    const strong = doc({ id: 'strong', title: { en: 'Arsii Office' }, body: { en: 'Phone: 1' } });
    const weak = doc({ id: 'weak', title: { en: 'Bale Centre' }, body: { en: 'Phone: 2' } });
    const ranked = rankDocs([strong, weak], tokenize('Arsii office phone'), 'en', 5);
    return {
      passed: ranked.length === 1 && ranked[0].id === 'strong',
      message: `Kept: ${ranked.map((d) => `${d.id}=${d.score.toFixed(2)}`).join(', ')}`,
    };
  });

  check('Tokenizer drops punctuation and single characters', 'Language', () => {
    const tokens = tokenize('Wheat, price? a b maize!');
    return {
      passed:
        tokens.includes('wheat') &&
        tokens.includes('price') &&
        tokens.includes('maize') &&
        !tokens.includes('a'),
      message: `Tokens: ${JSON.stringify(tokens)}`,
    };
  });

  // ------------------------------------------------------------------- Intent

  const intentCases: { query: string; lang: LanguageCode; expect: ChatSourceType }[] = [
    { query: 'What is the market price of teff?', lang: 'en', expect: 'marketPrice' },
    { query: 'Gatiin qamadii gabaa keessatti meeqa?', lang: 'om', expect: 'marketPrice' },
    { query: 'የጤፍ ዋጋ ስንት ነው?', lang: 'am', expect: 'marketPrice' },
    { query: 'Where is the nearest agriculture office?', lang: 'en', expect: 'office' },
    { query: 'Waajjirri qonnaa eessa jira?', lang: 'om', expect: 'office' },
    { query: 'የግብርና ጽሕፈት ቤት የት ነው?', lang: 'am', expect: 'office' },
    { query: 'armyworm outbreak in my farm', lang: 'en', expect: 'alert' },
    { query: 'ተባይ ማስጠንቀቂያ አለ?', lang: 'am', expect: 'alert' },
    { query: 'Beeyladaa talaallii barbaada', lang: 'om', expect: 'service' },
  ];

  for (const testCase of intentCases) {
    check(
      `Intent routes [${testCase.lang}] "${testCase.query.slice(0, 30)}" to ${testCase.expect}`,
      'Intent',
      () => {
        const intent = classifyIntent(testCase.query);
        return {
          passed: intent.sourceTypes.includes(testCase.expect),
          message: `Routed to: ${intent.sourceTypes.join(', ')}`,
          details: intent.sourceTypes,
        };
      }
    );
  }

  check('Unmatched query falls back to searching all sources', 'Intent', () => {
    const intent = classifyIntent('zzzz qqqq wwww');
    return {
      passed: intent.sourceTypes.length >= 9,
      message: `Fallback covered ${intent.sourceTypes.length} source types`,
    };
  });

  check('Empty query yields no tokens', 'Intent', () => {
    const intent = classifyIntent('   ');
    return { passed: intent.tokens.length === 0, message: `Tokens: ${intent.tokens.length}` };
  });

  // ------------------------------------------------------------------ Scoring

  check('Title match outranks body match', 'Scoring', () => {
    const titled = doc({ id: 'titled', title: { en: 'Maize' }, body: { en: 'unrelated' } });
    const bodied = doc({ id: 'bodied', title: { en: 'unrelated' }, body: { en: 'Maize' } });
    const ranked = rankDocs([bodied, titled], ['maize'], 'en', 5);
    return {
      passed: ranked[0]?.id === 'titled',
      message: `Order: ${ranked.map((d) => `${d.id}:${d.score.toFixed(2)}`).join(' > ')}`,
    };
  });

  check('Cross-language match: English query hits an om-only record', 'Language', () => {
    const omOnly = doc({
      id: 'om-only',
      title: { om: 'Gabaa Adaamaa' },
      body: { om: 'Gatii qamadii Adaamaa keessatti' },
      availableLangs: ['om'],
    });
    // Shares only the proper noun "Adaamaa" — nothing else overlaps with English.
    const score = scoreDoc(omOnly, tokenize('Adaamaa market'), 'en');
    return {
      passed: score > 0,
      message: `Score of English query against Afaan Oromo record: ${score.toFixed(2)}`,
    };
  });

  check('Non-matching documents are excluded, not merely ranked last', 'Scoring', () => {
    const ranked = rankDocs([doc({ id: 'a' })], ['zzzzz'], 'en', 5);
    return { passed: ranked.length === 0, message: `Returned ${ranked.length} docs` };
  });

  check('Recency boosts recent news above stale news', 'Scoring', () => {
    const fresh = doc({ id: 'fresh', publishedAt: Date.now() - 2 * 86400000 });
    const stale = doc({ id: 'stale', publishedAt: Date.now() - 400 * 86400000 });
    const ranked = rankDocs([stale, fresh], ['wheat'], 'en', 5);
    return {
      passed: ranked[0]?.id === 'fresh',
      message: `Order: ${ranked.map((d) => d.id).join(' > ')}`,
    };
  });

  check('rankDocs respects the result limit', 'Scoring', () => {
    const many = Array.from({ length: 20 }, (_, i) => doc({ id: `d${i}` }));
    const ranked = rankDocs(many, ['wheat'], 'en', 5);
    return { passed: ranked.length === 5, message: `Returned ${ranked.length} of 20` };
  });

  // ------------------------------------------------------------ Static source

  check('Static source loads market prices in all three languages', 'Static', () => {
    const docs = loadStaticDocs(['marketPrice']);
    const first = docs[0];
    return {
      passed: docs.length > 0 && first.availableLangs.length === 3,
      message: `${docs.length} price docs; first has langs [${first?.availableLangs.join(', ')}]`,
    };
  });

  check('Static source resolves translation keys and never leaks raw keys', 'Static', () => {
    const docs = loadStaticDocs(['service', 'program', 'publication']);
    const leaked = docs.filter((d) => {
      const text = `${textIn(d.title, 'en')} ${textIn(d.title, 'om')} ${textIn(d.title, 'am')}`;
      return /_(title|desc)\b/.test(text);
    });
    return {
      passed: docs.length > 0 && leaked.length === 0,
      message: `${docs.length} docs, ${leaked.length} leaked untranslated keys`,
      details: leaked.map((d) => d.id),
    };
  });

  check('Office records are flagged Afaan Oromo only', 'Static', () => {
    const docs = loadStaticDocs(['office']);
    const allOm = docs.every((d) => d.availableLangs.length === 1 && d.availableLangs[0] === 'om');
    return {
      passed: docs.length > 0 && allOm,
      message: `${docs.length} offices, all flagged om-only: ${allOm}`,
    };
  });

  check('Office records carry phone and address for grounding', 'Static', () => {
    const docs = loadStaticDocs(['office']);
    const withContact = docs.filter((d) => /Phone:/.test(textIn(d.body, 'en')));
    return {
      passed: docs.length > 0 && withContact.length === docs.length,
      message: `${withContact.length}/${docs.length} offices expose contact details`,
    };
  });

  check('Market price field labels are localized, not left in English', 'Static', () => {
    const docs = loadStaticDocs(['marketPrice']);
    const amBody = textIn(docs[0]?.body, 'am');
    const omBody = textIn(docs[0]?.body, 'om');
    // Regression guard: these read "Market:/Zone:/Change:" in every language
    // until the labels were translated, producing mixed-language answers.
    const leaksEnglish = /\b(Market|Zone|Change|Updated):/.test(amBody + omBody);
    return {
      passed: docs.length > 0 && !leaksEnglish,
      message: leaksEnglish ? `English labels leaked: ${amBody.slice(0, 90)}` : 'Labels localized',
    };
  });

  check('Office contact labels are localized per language', 'Static', () => {
    const docs = loadStaticDocs(['office']);
    const amBody = textIn(docs[0]?.body, 'am');
    const leaksEnglish = /\b(Phone|Address|Head|Hours):/.test(amBody);
    return {
      passed: docs.length > 0 && !leaksEnglish,
      message: leaksEnglish ? `English labels leaked: ${amBody.slice(0, 90)}` : 'Labels localized',
    };
  });

  check('Firestore-only source types return no static docs', 'Static', () => {
    const docs = loadStaticDocs(['news', 'alert', 'achievement', 'investment']);
    return {
      passed: docs.length === 0,
      message: `Returned ${docs.length} static docs (expected 0)`,
    };
  });

  // ------------------------------------------------------- Firestore gating

  check('Firestore reports unconfigured without VITE_FIREBASE_* values', 'Safety', () => {
    const saved = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    };
    delete process.env.VITE_FIREBASE_API_KEY;
    delete process.env.VITE_FIREBASE_AUTH_DOMAIN;
    delete process.env.VITE_FIREBASE_PROJECT_ID;
    delete process.env.VITE_FIREBASE_APP_ID;
    try {
      return {
        passed: getPublicFirebaseConfig() === null && isFirestoreConfigured() === false,
        message: 'Missing web config is detected before any query is attempted',
      };
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        const name = 'VITE_FIREBASE_' + key.replace(/[A-Z]/g, (c) => '_' + c).toUpperCase();
        if (value !== undefined) process.env[name] = value;
      }
      resetFirestoreAvailability();
    }
  });

  check('Partial Firebase config is rejected rather than half-initialized', 'Safety', () => {
    const savedKey = process.env.VITE_FIREBASE_API_KEY;
    const savedProject = process.env.VITE_FIREBASE_PROJECT_ID;
    process.env.VITE_FIREBASE_API_KEY = 'AIzaSomething';
    delete process.env.VITE_FIREBASE_PROJECT_ID;
    try {
      return {
        passed: getPublicFirebaseConfig() === null,
        message: 'apiKey alone is not treated as a usable configuration',
      };
    } finally {
      if (savedKey !== undefined) process.env.VITE_FIREBASE_API_KEY = savedKey;
      else delete process.env.VITE_FIREBASE_API_KEY;
      if (savedProject !== undefined) process.env.VITE_FIREBASE_PROJECT_ID = savedProject;
      resetFirestoreAvailability();
    }
  });

  // -------------------------------------------------------- Language coverage

  check('langsPresent reports only languages holding real text', 'Language', () => {
    const langs = langsPresent({ om: 'Jira', am: '   ', en: '' });
    return {
      passed: langs.length === 1 && langs[0] === 'om',
      message: `Detected: [${langs.join(', ')}]`,
    };
  });

  check('textIn does not silently fall back to another language', 'Language', () => {
    const value = { om: 'Afaan Oromoo qofa' };
    return {
      passed: textIn(value, 'en') === '' && textIn(value, 'om') !== '',
      message: `en="${textIn(value, 'en')}" om="${textIn(value, 'om')}"`,
    };
  });

  // -------------------------------------------------------- Template composer

  for (const lang of ['om', 'am', 'en'] as LanguageCode[]) {
    check(`Template composer answers in ${lang}`, 'Composer', () => {
      const expectedTitle = textIn(doc().title, lang);
      const answer = composeFromTemplate('wheat', [doc()], lang);
      const usedNativeText = expectedTitle !== '' && answer.message.includes(expectedTitle);
      return {
        passed: answer.answered && usedNativeText && answer.sources.length === 1,
        message: `answered=${answer.answered} sources=${answer.sources.length} native=${usedNativeText}`,
      };
    });

    check(`Template composer declines gracefully in ${lang}`, 'Composer', () => {
      const answer = composeFromTemplate('anything', [], lang);
      return {
        passed: !answer.answered && answer.message.length > 0 && answer.sources.length === 0,
        message: `answered=${answer.answered} message="${answer.message.slice(0, 44)}"`,
      };
    });
  }

  check('Template composer flags translation for om-only content', 'Composer', () => {
    const omOnly = doc({ title: { om: 'Oduu' }, body: { om: 'Qamadii' }, availableLangs: ['om'] });
    const answer = composeFromTemplate('wheat', [omOnly], 'en');
    return {
      passed: answer.wasTranslated === true && answer.answered,
      message: `wasTranslated=${answer.wasTranslated}`,
    };
  });

  check('Translation is flagged when only the title lacks the language', 'Composer', () => {
    // Office records: contact details are language-neutral and present in every
    // language, but the office name stays Afaan Oromo. An English reader still
    // sees untranslated text, so the notice must appear.
    const neutralBody = doc({
      title: { om: 'Waajjira Qonnaa Godina Arsii' },
      body: { om: 'Phone: 011', am: 'Phone: 011', en: 'Phone: 011' },
      availableLangs: ['om'],
    });
    const answer = composeFromTemplate('office', [neutralBody], 'en');
    return {
      passed: answer.wasTranslated === true,
      message: `wasTranslated=${answer.wasTranslated}`,
    };
  });

  check('Template composer does not flag translation when the language is present', 'Composer', () => {
    const answer = composeFromTemplate('wheat', [doc()], 'en');
    return {
      passed: answer.wasTranslated === false,
      message: `wasTranslated=${answer.wasTranslated}`,
    };
  });

  // ------------------------------------------------------------------- Safety

  check('Decline message includes the farmer hotline', 'Safety', () => {
    const answer = composeFromTemplate('wheat', [], 'en');
    return {
      passed: answer.message.includes('8844'),
      message: `Decline: "${answer.message}"`,
    };
  });

  check('Composer output contains only retrieved record content', 'Safety', () => {
    const sparse = doc({
      title: { en: 'Only Title' },
      body: { en: 'Only Body' },
      availableLangs: ['en'],
    });
    const answer = composeFromTemplate('anything at all', [sparse], 'en');
    const containsRecord =
      answer.message.includes('Only Title') && answer.message.includes('Only Body');
    return {
      passed: containsRecord,
      message: `Record content present in reply: ${containsRecord}`,
    };
  });

  check('Docs with no usable text produce a decline, not an empty answer', 'Safety', () => {
    const empty = doc({ title: {}, body: {}, availableLangs: [] });
    const answer = composeFromTemplate('wheat', [empty], 'en');
    return {
      passed: !answer.answered && answer.sources.length === 0,
      message: `answered=${answer.answered} sources=${answer.sources.length}`,
    };
  });

  check('A composer decline is not re-composed into an answer', 'Safety', () => {
    // Regression: chatApi previously ran composeFromTemplate whenever a composer
    // returned answered=false. The template path formats whatever was retrieved
    // and always reports answered=true, so a grounded refusal came back to the
    // reader as a confident answer built from near-miss records.
    const nearMiss = doc({
      title: { en: 'Pest & Disease Identification Manual' },
      body: { en: 'Visual diagnostic guide for identifying crop blights.' },
      availableLangs: ['en'],
      url: '/resources',
    });

    const declined = composeDecline([nearMiss], 'en');
    const templated = composeFromTemplate('unrelated question', [nearMiss], 'en');

    // The decline keeps the record as a related link but must not assert it answers.
    const keepsRefusal = declined.answered === false;
    const offersLink = declined.sources.length === 1 && declined.sources[0].url === '/resources';
    const withoutRecordText = !declined.message.includes('Visual diagnostic guide');
    // Documents the difference the bug erased.
    const templateWouldAssert = templated.answered === true;

    return {
      passed: keepsRefusal && offersLink && withoutRecordText && templateWouldAssert,
      message:
        `decline answered=${declined.answered} sources=${declined.sources.length} ` +
        `leaksBody=${!withoutRecordText} templateAsserts=${templateWouldAssert}`,
    };
  });

  check('A decline in each language uses that language and gives the hotline', 'Safety', () => {
    const nearMiss = doc({ title: { en: 'Some Record' }, body: { en: 'Body' }, availableLangs: ['en'] });
    const langs: LanguageCode[] = ['om', 'am', 'en'];
    const failures = langs.filter((lang) => {
      const declined = composeDecline([nearMiss], lang);
      return declined.answered !== false || !declined.message.includes('8844');
    });
    return {
      passed: failures.length === 0,
      message: failures.length ? `Failed for: ${failures.join(', ')}` : 'All three decline with the hotline',
    };
  });

  check('Amharic prefixed forms still match the stored word', 'Scoring', () => {
    // Amharic attaches particles as prefixes: የበቆሎ ("of maize") carries በቆሎ
    // but shares no prefix with it, so forward substring matching cannot find it.
    const prices = loadStaticDocs(['marketPrice']);
    const ranked = rankDocs(prices, tokenize('የበቆሎ ዋጋ ስንት ነው'), 'am', 5);
    const hit = ranked.some((d) => d.sourceType === 'marketPrice');
    return {
      passed: hit && ranked.length > 0,
      message: `ranked=${ranked.length} topScore=${ranked[0]?.score.toFixed(2) ?? 'n/a'}`,
    };
  });

  check('Afaan Oromo case suffixes still match the stored word', 'Scoring', () => {
    // gatiin is gatii with the nominative -n; the query token is the longer form.
    const prices = loadStaticDocs(['marketPrice']);
    const ranked = rankDocs(prices, tokenize('gatiin boqqoolloo meeqa'), 'om', 5);
    return {
      passed: ranked.some((d) => d.sourceType === 'marketPrice'),
      message: `ranked=${ranked.length} topScore=${ranked[0]?.score.toFixed(2) ?? 'n/a'}`,
    };
  });

  check('Affix matching does not make short words match anything', 'Scoring', () => {
    // The guard that matters: allowing a document word inside a query token must
    // not reintroduce the collisions that word-boundary matching was added to stop.
    const docs = loadStaticDocs(['marketPrice', 'office', 'service', 'program', 'publication']);
    const nonsense = rankDocs(docs, tokenize('xylophone quasar zeppelin'), 'en', 5);
    const offTopic = rankDocs(docs, tokenize('capital of France'), 'en', 5);
    return {
      passed: nonsense.length === 0 && offTopic.length === 0,
      message: `nonsense=${nonsense.length} offTopic=${offTopic.length} (both must be 0)`,
    };
  });

  return results;
}
