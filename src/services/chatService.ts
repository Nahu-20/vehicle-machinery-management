import { FARMER_HOTLINE } from '../constants';

export interface ChatRequest {
  message: string;
  language: 'om' | 'am' | 'en';
  conversationId?: string;
}

export interface ChatSource {
  title: string;
  url?: string;
}

export interface ChatResponse {
  message: string;
  conversationId?: string;
  sources?: ChatSource[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  status?: 'sending' | 'sent' | 'failed';
  sources?: ChatSource[];
}

/**
 * Chat Service Abstraction
 * ------------------------
 * FUTURE ENDPOINT INTEGRATION LOCATION:
 * To connect this frontend to an live n8n webhook or Mastra API endpoint:
 * 1. Set VITE_CHAT_API_URL in your environment (.env file)
 * 2. Uncomment the fetch call below inside sendChatMessage()
 * 3. Forward request parameters (message, language, conversationId) to the webhook
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const apiUrl = import.meta.env?.VITE_CHAT_API_URL || (typeof process !== 'undefined' ? process.env?.VITE_CHAT_API_URL : undefined);

  // If a live n8n or Mastra endpoint URL is configured, call it here:
  if (apiUrl && apiUrl.trim() !== '') {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: request.message,
          language: request.language,
          conversationId: request.conversationId || 'session-' + Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        message: data.message || data.output || 'No response text returned.',
        conversationId: data.conversationId || request.conversationId,
        sources: data.sources || [],
      };
    } catch (err) {
      console.warn('Falling back to local demonstration chat response:', err);
    }
  }

  // Local Demonstration Responses (Simulated delay of 600ms for realistic user feedback)
  await new Promise((resolve) => setTimeout(resolve, 600));

  const lang = request.language || 'om';
  const query = request.message.toLowerCase();

  // Quick action or key word matches
  if (query.includes('crop') || query.includes('midhaan') || query.includes('ሰብል') || query.includes('wheat') || query.includes('teff')) {
    return getCropGuidance(lang);
  }

  if (query.includes('livestock') || query.includes('beeylada') || query.includes('እንስሳት') || query.includes('cow') || query.includes('cattle')) {
    return getLivestockSupport(lang);
  }

  if (query.includes('market') || query.includes('gabaa') || query.includes('ገበያ') || query.includes('price')) {
    return getMarketInfo(lang);
  }

  if (query.includes('pest') || query.includes('awaannisa') || query.includes('ተባይ') || query.includes('worm')) {
    return getPestInfo(lang);
  }

  if (query.includes('irrigation') || query.includes('jallisii') || query.includes('መስኖ') || query.includes('weather') || query.includes('rooba')) {
    return getIrrigationInfo(lang);
  }

  if (query.includes('contact') || query.includes('office') || query.includes('waajjira') || query.includes('ጽሕፈት') || query.includes('phone')) {
    return getOfficeContactInfo(lang);
  }

  // Default demonstration fallback response
  return getDefaultDemoResponse(lang, request.message);
}

function getCropGuidance(lang: 'om' | 'am' | 'en'): ChatResponse {
  if (lang === 'om') {
    return {
      message: "Gorsa Oomisha Midhaanii: Biiroon Qonnaa Oromiyaa sanyii filatamaa Boqqolloi, Qamadii fi Teefii gannatti faayyadamaa sanyii eegaluu gorsa. Xaa'oo NPS fi Uree yeroodhaan akka facaastan, sanyii dhibee dandamatu filadhaa.",
      sources: [
        { title: "Sagantaalee Oomisha Midhaanii", url: "/programs" },
        { title: "Madaallii & Wabii Sanyii", url: "/resources" },
      ],
    };
  }
  if (lang === 'am') {
    return {
      message: "የሰብል ምርት መመሪያ፡ የኦሮሚያ ግብርና ቢሮ የተመረጡ የመቻቻል አቅም ያላቸው የስንዴ፣ የበቆሎና የጤፍ ዘሮችን እንድትጠቀሙ ይመክራል። ኤን.ፒ.ኤስ እና ዩሪያ ማዳበሪያን በወቅቱ ይጠቀሙ።",
      sources: [
        { title: "የሰብል ምርት ፕሮግራሞች", url: "/programs" },
        { title: "የግብርና መመሪያዎች", url: "/resources" },
      ],
    };
  }
  return {
    message: "Crop Production Guidance: The Oromia Agricultural Bureau recommends using certified drought-resistant seed varieties for Wheat, Teff, and Maize. Apply NPS and Urea fertilizers according to recommended zonal dosages.",
    sources: [
      { title: "Agricultural Programs", url: "/programs" },
      { title: "Publications & Manuals", url: "/resources" },
    ],
  };
}

function getLivestockSupport(lang: 'om' | 'am' | 'en'): ChatResponse {
  if (lang === 'om') {
    return {
      message: "Deeggarsa Fayyaa Beeyladaa: Talaalliin dhukkuba kottee fi afaan (FMD) fi Anthrax sagantaa gannatiin waajjiraalee qonnaa woreda keessatti keennamaa jira. Talaallii yeroo dhiyootti kennamuuf keessoo keessan galmeessisaa.",
      sources: [{ title: "Waajjiraalee Qonnaa Godinaalee", url: "/contact" }],
    };
  }
  if (lang === 'am') {
    return {
      message: "የእንስሳት እርባታና ጤና ድጋፍ፡ የከብት ክትባት (FMD እና Anthrax) በወረዳ ግብርና ጽሕፈት ቤቶች በነጻ እየተሰጠ ይገኛል። ለበለጠ መረጃ ወረዳዎትን ያነጋግሩ።",
      sources: [{ title: "የዞን ጽሕፈት ቤቶች", url: "/contact" }],
    };
  }
  return {
    message: "Livestock Health & Support: Free seasonal vaccination campaigns against Foot-and-Mouth Disease (FMD) and Anthrax are currently active at all Woreda Agricultural Offices.",
    sources: [{ title: "Regional Office Directory", url: "/contact" }],
  };
}

function getMarketInfo(lang: 'om' | 'am' | 'en'): ChatResponse {
  if (lang === 'om') {
    return {
      message: "Odeeffannoo Gabaa Qonnaa: Gabaa Adaamaa, Jimmaa fi Shashemene keessatti gatiin Qamadii kuntaalaan qunnamtii gabaa mootummaan socho'aa jira. Odeeffannoo gatii sa'aatii 24f toora intarneetiin hordofaa.",
      sources: [{ title: "Tajaajila Gabaa Qonnaa", url: "/services" }],
    };
  }
  if (lang === 'am') {
    return {
      message: "የግብርና ገበያ መረጃ፡ በአዳማ፣ ጂማ እና ሻሸመኔ ገበያዎች የወቅቱ የስንዴና የበቆሎ ዋጋ መረጋጋት ያሳያል። ወቅታዊ መረጃዎችን ከግብርና ቢሮ አገልግሎቶች ያግኙ።",
      sources: [{ title: "የግብርና አገልግሎቶች", url: "/services" }],
    };
  }
  return {
    message: "Agricultural Market Information: Current farmgate commodity price updates for major markets (Adama, Jimma, Shashemene) are available through our Agricultural Market Intelligence Service.",
    sources: [{ title: "Market Intelligence Services", url: "/services" }],
  };
}

function getPestInfo(lang: 'om' | 'am' | 'en'): ChatResponse {
  if (lang === 'om') {
    return {
      message: "Ittisa Awaannisaa fi Dhukkubootaa: Qorannoon lafa godhamuu dhiyeenya hoomaa awaannisaa naannoo Arsii fi Baalee irratti ittisi meeshaaleen summii fi bishaan aadaa godhamaa jira. Beeksisa ariifachiisaa hordofaa.",
      sources: [{ title: "Beeksisa Ariifachiisaa", url: "/alerts" }],
    };
  }
  if (lang === 'am') {
    return {
      message: "የተባይና የበሽታ መከላከያ፡ በሙቅና ደረቅ አካባቢዎች የሚከሰተውን የቀንድ አውጣና የተባይ መንጋ ለመከላከል የግብርና ቢሮ ዝግጅቱን አጠናቋል። የአስቸኳይ ጊዜ ማስጠንቀቂያዎችን ይመልከቱ።",
      sources: [{ title: "የአስቸኳይ ጊዜ ማስጠንቀቂያዎች", url: "/alerts" }],
    };
  }
  return {
    message: "Pest & Advisory Surveillance: Zonal rapid-response pest control units are monitoring crop areas for armyworm and rust outbreaks. Please monitor our active advisory bulletins.",
    sources: [{ title: "Emergency Alerts & Bulletins", url: "/alerts" }],
  };
}

function getIrrigationInfo(lang: 'om' | 'am' | 'en'): ChatResponse {
  if (lang === 'om') {
    return {
      message: "Deeggarsa Jallisii: Pompota jallisii soolaaraa fi misooma paampii bishaan lafa jalaa argachuuf deeggarsa teeknikaa waajjiraalee qonnaa keessatti argachuu dandeessu.",
      sources: [{ title: "Sagantaa Jallisii", url: "/programs" }],
    };
  }
  if (lang === 'am') {
    return {
      message: "የመስኖና አየር ሁኔታ ድጋፍ፡ የፀሐይ ኃይል የመስኖ ፓምፖችና የመሬት ውስጥ ውሃ ልማት ቴክኒካል ድጋፍ በዞን ግብርና መመሪያዎች ይገኛል።",
      sources: [{ title: "የመስኖ ልማት ፕሮግራሞች", url: "/programs" }],
    };
  }
  return {
    message: "Irrigation & Water Management: Technical support for solar-powered irrigation pumps and groundwater extraction is accessible via zonal agriculture departments.",
    sources: [{ title: "Irrigation Programs", url: "/programs" }],
  };
}

function getOfficeContactInfo(lang: 'om' | 'am' | 'en'): ChatResponse {
  if (lang === 'om') {
    return {
      message: `Sarara Bilisaa Biiroo Qonnaa Oromiyaa: ${FARMER_HOTLINE} (Toll-Free). Waajjiraalee qonnaa godinaalee 21 Oromiyaa keessatti argaman qunnamuuf toora kanaan deemaa.`,
      sources: [{ title: "Teessoo Waajjiraalee", url: "/contact" }],
    };
  }
  if (lang === 'am') {
    return {
      message: `የኦሮሚያ ግብርና ቢሮ ነጻ ስልክ ቁጥር፡ ${FARMER_HOTLINE}። በ21 የኦሮሚያ ዞኖች የሚገኙ ጽሕፈት ቤቶችን አድራሻ ያግኙ።`,
      sources: [{ title: "የጽሕፈት ቤቶች አድራሻ", url: "/contact" }],
    };
  }
  return {
    message: `Oromia Agriculture Bureau Toll-Free Hotline: ${FARMER_HOTLINE}. You can also locate contact details and telephone numbers for all 21 Zonal Agricultural Offices.`,
    sources: [{ title: "Regional Office Directory", url: "/contact" }],
  };
}

function getDefaultDemoResponse(lang: 'om' | 'am' | 'en', queryText: string): ChatResponse {
  if (lang === 'om') {
    return {
      message: `Gargaaraan kun yeroo ampaa agarsiisaa (prototype) dha. Gaaffiin keessan ("${queryText}") sarara n8n/Mastra yaada yaalii waliin hin qabamne. Odeeffannoo ariifachiisaaf sarara bilisaa ${FARMER_HOTLINE} irratti bilbilaa ykn tajaajilawwan keenya daawwadhaa.`,
      sources: [
        { title: "Tajaajilawwan Qonnaa", url: "/services" },
        { title: "Beeksisa Ariifachiisaa", url: "/alerts" },
        { title: "Waajjiraalee Qonnaa", url: "/contact" },
      ],
    };
  }
  if (lang === 'am') {
    return {
      message: `ይህ ረዳት በአሁኑ ጊዜ ለማሳያ (prototype) የቀረበ ነው:: ጥያቄዎ ("${queryText}") ከቀጥታ n8n/Mastra አገልግሎት ጋር አልተገናኘም። ለአስቸኳይ መረጃ በነጻ ስልክ ቁጥር ${FARMER_HOTLINE} ይደውሉ ወይም አገልግሎቶቻችንን ይጎብኙ።`,
      sources: [
        { title: "የግብርና አገልግሎቶች", url: "/services" },
        { title: "የአስቸኳይ ጊዜ ማስጠንቀቂያዎች", url: "/alerts" },
        { title: "የጽሕፈት ቤቶች አድራሻ", url: "/contact" },
      ],
    };
  }
  return {
    message: `This assistant is currently operating in frontend demonstration mode. Your query ("${queryText}") is ready for integration with an n8n or Mastra workflow endpoint (VITE_CHAT_API_URL). For immediate assistance, call toll-free hotline ${FARMER_HOTLINE} or browse our directory.`,
    sources: [
      { title: "Agricultural Services", url: "/services" },
      { title: "Emergency Alerts", url: "/alerts" },
      { title: "Regional Offices", url: "/contact" },
    ],
  };
}
