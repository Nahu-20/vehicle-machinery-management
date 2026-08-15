import { LocalizedText, NewsCategory } from '../types/news';

export interface EventItem {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  category: 'expo' | 'field_day' | 'summit' | 'workshop' | 'training';
  startDate: string; // ISO date string or formatted
  endDate?: string;
  time: string;
  venue: LocalizedText;
  zone: string;
  organizer: LocalizedText;
  expectedAttendance: string;
  admissionType: 'open_public' | 'registration_required' | 'invitation_only';
  featuredImage: string;
  agendaHighlights: LocalizedText[];
  isFeatured?: boolean;
  registrationOpen: boolean;
  contactEmail: string;
  contactPhone: string;
}

export interface TenderItem {
  id: string;
  referenceNumber: string;
  title: LocalizedText;
  procuringEntity: LocalizedText;
  category: 'machinery' | 'inputs' | 'construction' | 'consultancy' | 'irrigation';
  publishedDate: string;
  closingDate: string;
  closingTime: string;
  daysRemaining: number;
  bidSecurityETB: string;
  documentFeeETB: string;
  dossierSize: string;
  eligibility: LocalizedText;
  status: 'active' | 'under_evaluation' | 'awarded' | 'closed';
  submissionLocation: LocalizedText;
  fileDownloadUrl: string;
}

export interface MediaAsset {
  id: string;
  title: LocalizedText;
  type: 'logo_kit' | 'factsheet' | 'press_release_pdf' | 'photo_gallery' | 'presentation';
  fileFormat: string;
  fileSize: string;
  updatedDate: string;
  downloadUrl: string;
  description: LocalizedText;
  thumbnailUrl: string;
}

export interface RadioDispatchEpisode {
  id: string;
  episodeNumber: number;
  title: LocalizedText;
  summary: LocalizedText;
  duration: string;
  broadcastDate: string;
  host: LocalizedText;
  guest: LocalizedText;
  topicCategory: LocalizedText;
  audioDurationSeconds: number;
}

export const comprehensiveEvents: EventItem[] = [
  {
    id: 'evt-1',
    slug: 'oromia-annual-agri-tech-expo-2026',
    title: {
      om: 'Expoo Teeknooloojii fi Meeshaalee Qonnaa Oromiyaa Bara 2026',
      am: 'የ2026 የኦሮሚያ ግብርና ቴክኖሎጂና መሣሪያዎች ዓመታዊ ኤክስፖ',
      en: 'Oromia Annual Agri-Tech & Machinery Expo 2026',
    },
    description: {
      om: 'Agarsiisa teeknooloojii qonnaa guddaa biyyoolessaa Adaamaatti geggeeffamu. Tiraakteroota ammayyaa, paampii soolaaraa, droonii fi meeshaalee qonnaa saayinsawaa 150+ dhihaatu.',
      am: 'በአዳማ ከተማ የሚካሄደው ታላቁ የግብርና ቴክኖሎጂ ኤክስፖ። ዘመናዊ ትራክተሮች፣ የፀሐይ ውኃ ፓምፖች፣ ድሮኖች እና ከ150 በላይ የግብርና ፈጠራዎች ይቀርባሉ።',
      en: 'The premier regional agricultural innovation showcase in Adama City. Featuring 150+ international machinery manufacturers, solar pump suppliers, crop drones, and smart farm systems.',
    },
    category: 'expo',
    startDate: 'August 28, 2026',
    endDate: 'August 31, 2026',
    time: '08:30 AM - 05:30 PM EAT',
    venue: {
      om: 'Galma Walgahii fi Agarsiisaa Magaalaa Adaamaa',
      am: 'የአዳማ ከተማ የኤግዚቢሽንና የስብሰባ አዳራሽ',
      en: 'Adama Exhibition & Cultural Convention Center',
    },
    zone: 'East Shewa (Adaamaa)',
    organizer: {
      om: 'Biiroo Qonnaa Oromiyaa & Dhaabbata Teeknooloojii Qonnaa',
      am: 'የኦሮሚያ ግብርና ቢሮ እና የግብርና ቴክኖሎጂ ተቋም',
      en: 'Oromia Agricultural Bureau & Mechanization Directorate',
    },
    expectedAttendance: '25,000+ Visitors & Farmers',
    admissionType: 'open_public',
    featuredImage: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=1000&q=80',
    agendaHighlights: [
      {
        om: 'Bariin Eebba Expoo fi Agarsiisa Tiraaktaroota Humna Ol\'aanaa',
        am: 'የኤክስፖው መክፈቻና የከፍተኛ ጉልበት ትራክተሮች ማሳያ',
        en: 'Official Opening Ceremony & Heavy Machinery Field Demonstrations',
      },
      {
        om: 'Waliigaltee Liizii Meeshaa Qonnaa Baankii Hojii Gamtaa Oromiyaa Waliin',
        am: 'ከኦሮሚያ ህብረት ሥራ ባንክ ጋር የሊዝ ማሽነሪ ስምምነት ፊርማ',
        en: 'Lease-to-Own Financing Signing with Cooperative Bank of Oromia',
      },
      {
        om: 'Dorgommii Dargaggoota Kalaqa Teeknooloojii Qonnaa (Agri-Hackathon)',
        am: 'የወጣት ግብርና ቴክኖሎጂ ፈጣሪዎች ውድድር',
        en: 'Youth Agri-Tech Hackathon & Smart Drone Irrigation Pitch Competition',
      },
    ],
    isFeatured: true,
    registrationOpen: true,
    contactEmail: 'agritech.expo@oab.gov.et',
    contactPhone: '+251 22 111 4455',
  },
  {
    id: 'evt-2',
    slug: 'regional-specialty-coffee-harvest-summit-jimma',
    title: {
      om: 'Waltajjii Guddisa Oomisha Bunaa Qulqullina Ol\'aanaa fi Daldala Alaa Jimmaa',
      am: 'የጅማ የልዩ ጥራት ቡና አምራቾችና ላኪዎች ጉባኤ',
      en: 'Oromia Specialty Coffee Summit & International Cupping Forum',
    },
    description: {
      om: 'Waltajjii oomishtoota bunaa Jimmaa, Gujii, fi Harargee waldaalee daldala alaa waliin wal-qunnamsiisu. Qorannoo qulqullinaa (cupping) fi dhiheessii buna orgaanikii irratti xiyyeeffata.',
      am: 'በጅማ ከተማ የሚካሄደው የልዩ ጥራት ቡና አምራቾች፣ የህብረት ሥራ ማህበራትና ዓለም አቀፍ ገዢዎች ታላቅ የውይይትና የቅምሻ መድረክ።',
      en: 'A high-level gathering uniting 400+ coffee primary cooperative leaders, eco-washing station operators, and global specialty buyers in Jimma City.',
    },
    category: 'summit',
    startDate: 'September 12, 2026',
    endDate: 'September 14, 2026',
    time: '09:00 AM - 05:00 PM EAT',
    venue: {
      om: 'Institiyuutii Qorannoo Qonnaa Jimmaa (IQQO Hall)',
      am: 'የጅማ ግብርና ምርምር ማዕከል አዳራሽ',
      en: 'Jimma Agricultural Research Center Auditorium, Jimma',
    },
    zone: 'Jimma',
    organizer: {
      om: 'Kutaa Misooma Bunaa fi Shaayii Biiroo Qonnaa Oromiyaa',
      am: 'የኦሮሚያ ግብርና ቢሮ ቡናና ሻይ ልማት ዳይሬክቶሬት',
      en: 'Oromia Coffee & Tea Development Directorate',
    },
    expectedAttendance: '800+ Delegates',
    admissionType: 'registration_required',
    featuredImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
    agendaHighlights: [
      {
        om: 'Dorgommii Qulqullina Bunaa Qubsumma Addunyaa (Specialty Cupping 88+)',
        am: 'የዓለም አቀፍ ደረጃ የቡና ቅምሻ ውድድር',
        en: 'Specialty Arabica Cupping Competition (Grade 1 & Micro-Lots)',
      },
      {
        om: 'Leenjii Tooftaa Misooma Buna Dhibee Dandamatuu (CBD-Resistant)',
        am: 'የቡና በሽታ መቋቋም ሥልጠና',
        en: 'Agronomy Masterclass: Stumping & Organic Washing Protocols',
      },
      {
        om: 'Sirna Waliigaltee Bitta Kallattii Daldaltoota Alaa Waliin',
        am: 'ከውጭ ገዢዎች ጋር የቀጥታ ግዢ ስምምነት',
        en: 'Direct Trade Purchase Agreements for 2026/27 Crop Season',
      },
    ],
    isFeatured: true,
    registrationOpen: true,
    contactEmail: 'coffee.summit@oab.gov.et',
    contactPhone: '+251 47 111 8900',
  },
  {
    id: 'evt-3',
    slug: 'farmers-field-day-wheat-cluster-bale',
    title: {
      om: 'Guyyaa Dirree Qonnaan Bulaa: Agarsiisa Sassaabbii Qamadii Klasteeraa Baalee',
      am: 'የአርሶ አደሮች የመስክ ቀን፡ የባሌ የስንዴ ክላስተር ምርት ማሳያ',
      en: 'Farmers\' Field Day: Mechanized Wheat Cluster Demonstration in Bale',
    },
    description: {
      om: 'Daawwannaa dirree qamadii hektaara 4,000 irratti kombayinaaraan oomishamaa jiru. Sanyiiwwan fooyya\'oo fi to\'annoo waaggaa qabatamaan agarsiifamu.',
      am: 'በባሌ ዞን 4 ሺህ ሄክታር መሬት ላይ በኮምባይን እየተሰበሰበ ያለ የስንዴ ክላስተር ማሳያ የመስክ ጉብኝት።',
      en: 'Live field demonstration spanning 4,000 hectares of mechanized wheat clusters in Sinana Woreda, Bale Zone. Showcasing rust-resistant varieties and soil conservation.',
    },
    category: 'field_day',
    startDate: 'September 22, 2026',
    endDate: 'September 23, 2026',
    time: '08:00 AM - 04:00 PM EAT',
    venue: {
      om: 'Kellaa Eksteenshinii fi Dirree Klasteeraa Sinaanaa, Baalee',
      am: 'የሲናና ወረዳ ኤክስቴንሽን ማዕከልና የስንዴ ክላስተር ማሳ',
      en: 'Sinana Model Agricultural Extension Center & Farmland, Bale',
    },
    zone: 'Bale (Robe/Sinana)',
    organizer: {
      om: 'Waajjira Qonnaa Godina Baalee & Daarektoreetii Midhaanii',
      am: 'የባሌ ዞን ግብርና መምሪያ እና የሰብል ልማት ዳይሬክቶሬት',
      en: 'Bale Zone Agricultural Department & IQQO Sinana',
    },
    expectedAttendance: '3,500+ Cluster Farmers',
    admissionType: 'open_public',
    featuredImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
    agendaHighlights: [
      {
        om: 'Agarsiisa Sassaabbii Kombayinaaraa fi Kuusaa Boombii (Hermetic Silo)',
        am: 'የኮምባይን ሰብሰቢዎችና የዘመናዊ ጎተራዎች አጠቃቀም ማሳያ',
        en: 'Heavy-duty combine harvester fleet harvesting demonstration',
      },
      {
        om: 'Badhaasa Qonnaan Bultoota Fakkeenyaa Kuntala 50+ Hektaaraatti Galmeessan',
        am: 'በሄክታር ከ50 ኲንታል በላይ ላስመዘገቡ አርሶ አደሮች ሽልማት',
        en: 'Exemplary Lead Farmers Awards for 50+ quintals/ha output',
      },
    ],
    isFeatured: false,
    registrationOpen: true,
    contactEmail: 'bale.fieldday@oab.gov.et',
    contactPhone: '+251 22 665 1200',
  },
  {
    id: 'evt-4',
    slug: 'dry-season-irrigation-masterclass-arsi',
    title: {
      om: 'Simpooziyemii fi Leenjii Jallisii Bonaa Godina Arsii fi Arsii Dhihaa',
      am: 'የበጋ መስኖ ልማት ሲምፖዚየምና የውኃ አጠቃቀም ሥልጠና',
      en: 'Dry-Season (Bona) Irrigation Masterclass & Solar Pumping Symposium',
    },
    description: {
      om: 'Qonnaan bultoota fi ogeessota jallisii 1,200f leenjii paampii soolaaraa, jallisii dhangala\'aa (drip), fi sirna dabaree bishaanii qindeessuu.',
      am: 'ለ1,200 የመስኖ አርሶ አደሮችና ባለሙያዎች የተዘጋጀ የፀሐይ ውኃ ፓምፕ፣ የጠብታ መስኖና የውኃ ክፍፍል ሥርዓት ሥልጠና።',
      en: 'Comprehensive technical workshop for 1,200 irrigation cluster leaders focusing on solar submersible pump maintenance and zero-waste drip irrigation.',
    },
    category: 'workshop',
    startDate: 'October 05, 2026',
    endDate: 'October 06, 2026',
    time: '09:00 AM - 04:30 PM EAT',
    venue: {
      om: 'Koolleejjii Qonnaa fi Teeknooloojii Asellaa, Arsii',
      am: 'የአሰላ ግብርና ኮሌጅ የስብሰባ ማዕከል',
      en: 'Asella Agricultural College Auditorium, Asella',
    },
    zone: 'Arsi (Asellaa)',
    organizer: {
      om: 'Biiroo Misooma Jallisii fi Qabeenya Bishaan Oromiyaa',
      am: 'የኦሮሚያ መስኖና ውኃ ሀብት ልማት ቢሮ',
      en: 'Oromia Irrigation & Water Resource Bureau',
    },
    expectedAttendance: '1,200 Participants',
    admissionType: 'registration_required',
    featuredImage: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1000&q=80',
    agendaHighlights: [
      {
        om: 'Agarsiisa Qabatamaa Suphaa fi To\'annoo Paampii Soolaraa',
        am: 'የፀሐይ ውኃ ፓምፕ ጥገናና አጠቃቀም ማሳያ',
        en: 'Hands-on photovoltaic pump troubleshooting & inverter calibration',
      },
      {
        om: 'Qajeelfama Qusannaa Bishaan Laga Awash & Rift Valley',
        am: 'የአዋሽና ሪፍት ቫሊ ውኃ አጠቃቀም መመሪያ',
        en: 'Basin-wide water allocation protocols for dry-season horticulture',
      },
    ],
    isFeatured: false,
    registrationOpen: true,
    contactEmail: 'irrigation.symposium@oab.gov.et',
    contactPhone: '+251 22 331 4500',
  },
  {
    id: 'evt-5',
    slug: 'avocado-horticulture-export-conference-bishoftu',
    title: {
      om: 'Konfaransii Daldala Alaa Avokaadoo fi Kuduraa Oromiyaa',
      am: 'የኦሮሚያ አቮካዶና ሆርቲካልቸር የውጭ ንግድ ጉባኤ',
      en: 'Oromia Avocado & Horticultural Export Trade Conference',
    },
    description: {
      om: 'Waltajjii oomishtoota avokaadoo Hass, qindeessitoota agro-parkii fi daldaltoota gabaa Yuurooppi fi Baha Giddu-galeessaa walitti fidu.',
      am: 'የሃስ አቮካዶ አምራቾችን፣ የአግሮ ኢንዱስትሪ ፓርኮችንና የውጭ ገዢዎችን የሚያገናኝ የንግድ ጉባኤ።',
      en: 'B2B matchmaking conference connecting Hass avocado outgrowers, cold-chain logistics providers, and certified export packhouses in Bishoftu.',
    },
    category: 'summit',
    startDate: 'October 18, 2026',
    endDate: 'October 19, 2026',
    time: '08:30 AM - 05:00 PM EAT',
    venue: {
      om: 'Wiirtuu Konfaransii Magaalaa Bishooftuu',
      am: 'የቢሾፍቱ ከተማ ኮንፈረንስ ማዕከል',
      en: 'Bishoftu International Convention Hall, Bishoftu',
    },
    zone: 'East Shewa (Bishooftuu)',
    organizer: {
      om: 'Biiroo Qonnaa Oromiyaa & Korporeeshinii Agro-Industrii',
      am: 'የኦሮሚያ ግብርና ቢሮ እና የአግሮ ኢንዱስትሪ ኮርፖሬሽን',
      en: 'Oromia Agricultural Bureau & Horticulture Directorate',
    },
    expectedAttendance: '600+ Exporters & Outgrowers',
    admissionType: 'registration_required',
    featuredImage: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1000&q=80',
    agendaHighlights: [
      {
        om: 'Mirkaneessa Qulqullina GlobalGAP fi Phytosanitary EU/Gulf',
        am: 'የግሎባል ጋፕና የኳራንቲን የጥራት ማረጋገጫ መስፈርቶች',
        en: 'GlobalGAP and cold-chain compliance certification workshop',
      },
      {
        om: 'Sirna Gabaa Kallattii Agro-Processing Parkii Bulbulaa Waliin',
        am: 'ከቡልቡላ የተቀናጀ አግሮ ኢንዱስትሪ ፓርክ ጋር ትስስር መፍጠር',
        en: 'Integration contracts with Bulbula Integrated Agro-Industrial Park',
      },
    ],
    isFeatured: false,
    registrationOpen: true,
    contactEmail: 'horticulture.export@oab.gov.et',
    contactPhone: '+251 11 433 8899',
  },
  {
    id: 'evt-6',
    slug: 'livestock-dairy-genetic-improvement-holeta',
    title: {
      om: 'Walgahii Fooyya\'iinsa Sanyii Beeyladaa fi Oomisha Aannanii Hoolataa',
      am: 'የሆለታ የእንስሳት ዝርያ ማሻሻያና የወተት ልማት ጉባኤ',
      en: 'Livestock Genetic Improvement & Dairy Value Chain Forum',
    },
    description: {
      om: 'Sagantaa Yelemat Tirufat deeggaruun sanyii saawwaa aannanii fooyya\'oo, talaallii ammayyaa fi nyaata beeyladaa teeknoloojiin qophaa\'u dhiheessuu.',
      am: 'የሌማት ትሩፋት መርሃ ግብርን መሠረት በማድረግ የወተት ላሞች ዝርያ ማሻሻያ፣ ዘመናዊ ክትባትና የተመጣጠነ መኖ አቅርቦት ላይ ያተኮረ መድረክ።',
      en: 'High-impact technical conference evaluating artificial insemination coverage, silage preparation, and pasteurized dairy collection hubs across 18 dairy zones.',
    },
    category: 'training',
    startDate: 'November 02, 2026',
    endDate: 'November 03, 2026',
    time: '09:00 AM - 04:30 PM EAT',
    venue: {
      om: 'Wiirtuu Qorannoo Horsiisa Beeyladaa Hoolataa (IQQO Holeta)',
      am: 'የሆለታ እንስሳት ምርምር ማዕከል አዳራሽ',
      en: 'National Animal Genetic Resources Center, Holeta',
    },
    zone: 'West Shewa (Hoolataa)',
    organizer: {
      om: 'Biiroo Fayyaa Beeyladaa fi Misooma Aannanii Oromiyaa',
      am: 'የኦሮሚያ እንስሳት ጤናና ወተት ልማት ቢሮ',
      en: 'Oromia Livestock & Dairy Development Directorate',
    },
    expectedAttendance: '750+ Livestock Professionals',
    admissionType: 'open_public',
    featuredImage: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=1000&q=80',
    agendaHighlights: [
      {
        om: 'Agarsiisa Ulfeessa Saawwaa Ammayyaa (Sexed Semen AI)',
        am: 'የተመረጠ የዘር ማዳቀል ቴክኖሎጂ ማሳያ',
        en: 'Sexed semen artificial insemination field trial results',
      },
      {
        om: 'Sirna Nyaata Beeyladaa Silage fi Marga Filatamaa Raabsuu',
        am: 'የሳይሌጅና የምርጥ መኖ ዝርያዎች አቅርቦት',
        en: 'Total mixed ration silage production and fodder seed kits',
      },
    ],
    isFeatured: false,
    registrationOpen: true,
    contactEmail: 'livestock.forum@oab.gov.et',
    contactPhone: '+251 11 237 0100',
  },
];

export const comprehensiveTenders: TenderItem[] = [
  {
    id: 'tnd-1',
    referenceNumber: 'OAB/NCB/IRR-08/2026',
    title: {
      om: 'Caalbaasii Bitta fi Dhaabbii Paampii Soolaraa Humna Ol\'aanaa 450 (Solar Submersible Pumps)',
      am: 'የ450 በፀሐይ ኃይል የሚሰሩ የውኃ ፓምፖች ግዢና ተከላ ጨረታ',
      en: 'Procurement & Installation of 450 Solar Submersible Deep-Well Pumping Systems',
    },
    procuringEntity: {
      om: 'Biiroo Misooma Jallisii fi Qabeenya Bishaan Oromiyaa',
      am: 'የኦሮሚያ መስኖና ውኃ ሀብት ልማት ቢሮ',
      en: 'Oromia Irrigation & Water Resource Bureau Procurement Directorate',
    },
    category: 'irrigation',
    publishedDate: 'August 02, 2026',
    closingDate: 'August 28, 2026',
    closingTime: '10:00 AM EAT',
    daysRemaining: 13,
    bidSecurityETB: 'ETB 300,000.00 (CPO / Bank Guarantee)',
    documentFeeETB: 'ETB 1,000.00',
    dossierSize: '4.8 MB (PDF Packet)',
    eligibility: {
      om: 'Dhaabbilee dhiheessii meeshaa jallisii hayyama daldalaa fi ragaa gibira bara 2018 qaban.',
      am: 'የዘመኑ የታደሰ ንግድ ፈቃድና የታክስ ክሊራንስ ያላቸው ህጋዊ የውኃ መሳሪያዎች አቅራቢዎች።',
      en: 'Licensed electro-mechanical water engineering contractors with renewed 2018/2026 trade licenses and VAT registration.',
    },
    status: 'active',
    submissionLocation: {
      om: 'Biiroo Qonnaa Oromiyaa, Finfinnee, Gamoo A, Kutaa 304',
      am: 'የኦሮሚያ ግብርና ቢሮ፣ አዲስ አበባ፣ ህንፃ ሀ፣ ቢሮ ቁጥር 304',
      en: 'Oromia Agricultural Bureau HQ, Finfinnee, Block A, Room 304',
    },
    fileDownloadUrl: '#',
  },
  {
    id: 'tnd-2',
    referenceNumber: 'OAB/ICB/TRAC-02/2026',
    title: {
      om: 'Caalbaasii Addunyaa Bitta Tiraaktaroota Qonnaa 200 fi Kombayinaara 60 (Machinery Fleet)',
      am: 'የ200 ዘመናዊ ትራክተሮችና የ60 ኮምባይኖች ዓለም አቀፍ ግዢ ጨረታ',
      en: 'International Competitive Bid for 200 Heavy-Duty Tractors & 60 Grain Combine Harvesters',
    },
    procuringEntity: {
      om: 'Kutaa Bitta fi Qabeenya Biiroo Qonnaa Oromiyaa',
      am: 'የኦሮሚያ ግብርና ቢሮ ግዢና ንብረት አስተዳደር',
      en: 'Oromia Bureau of Agriculture - International Procurement Board',
    },
    category: 'machinery',
    publishedDate: 'July 28, 2026',
    closingDate: 'September 10, 2026',
    closingTime: '02:30 PM EAT',
    daysRemaining: 26,
    bidSecurityETB: 'USD $25,000 or ETB 2,500,000 CPO',
    documentFeeETB: 'ETB 2,000.00 / USD $50',
    dossierSize: '12.4 MB (Full Technical Specifications)',
    eligibility: {
      om: 'Oomishtoota meeshaa qonnaa addunyaa ykn bakka-bu\'oota seeraa Itoophiyaa keessa jiran.',
      am: 'ዓለም አቀፍ የግብርና መሣሪያዎች አምራቾች ወይም ህጋዊ የሀገር ውስጥ ወኪሎች።',
      en: 'Authorized international OEM manufacturers or tier-1 authorized distributors with ISO-9001 certification.',
    },
    status: 'active',
    submissionLocation: {
      om: 'Waajjira Daarektoreetii Bitta fi Qabeenyaa Finfinnee',
      am: 'የግዢና ንብረት ዳይሬክቶሬት ጽህፈት ቤት አዲስ አበባ',
      en: 'Procurement Board Tender Box, Main Gate Complex, Finfinnee',
    },
    fileDownloadUrl: '#',
  },
  {
    id: 'tnd-3',
    referenceNumber: 'OAB/NCB/SEED-14/2026',
    title: {
      om: 'Caalbaasii Dhiheessii Biqiltuu Avokaadoo Hass Filatamaa Kuma 250 (Grafted Seedlings)',
      am: 'የ250 ሺህ የተሻሻሉ የሃስ አቮካዶ ችግኞች አቅርቦት ጨረታ',
      en: 'National Competitive Bid for Supply of 250,000 Certified Grafted Hass Avocado Seedlings',
    },
    procuringEntity: {
      om: 'Daarektoreetii Misooma Kuduraa fi Fuduraa Oromiyaa',
      am: 'የኦሮሚያ አትክልትና ፍራፍሬ ልማት ዳይሬክቶሬት',
      en: 'Horticulture Development Directorate, OAB',
    },
    category: 'inputs',
    publishedDate: 'August 01, 2026',
    closingDate: 'September 04, 2026',
    closingTime: '10:30 AM EAT',
    daysRemaining: 20,
    bidSecurityETB: 'ETB 150,000.00',
    documentFeeETB: 'ETB 500.00',
    dossierSize: '2.9 MB (Agronomy Spec Packet)',
    eligibility: {
      om: 'Dhaabbilee baay\'isa biqiltuu mirkanaa\'aa (Certified Nurseries) qaban.',
      am: 'በግብርና ባለስልጣን የተረጋገጠ የችግኝ ማፍያ ጣቢያ ያላቸው አቅራቢዎች።',
      en: 'Certified commercial plant nurseries with regional phytosanitary certificates.',
    },
    status: 'active',
    submissionLocation: {
      om: 'Biiroo Qonnaa Oromiyaa, Kutaa Bitta Lakk. 112',
      am: 'የኦሮሚያ ግብርና ቢሮ፣ ቢሮ ቁጥር 112',
      en: 'OAB Horticulture Directorate Procurement Desk, Room 112',
    },
    fileDownloadUrl: '#',
  },
  {
    id: 'tnd-4',
    referenceNumber: 'OAB/NCB/SILO-05/2026',
    title: {
      om: 'Caalbaasii Ijaarsa Kuusaa Midhaanii Ammayyaa (Hermetic Grain Silos) Godinaalee 6tti',
      am: 'በ6 ዞኖች የዘመናዊ እህል ማከማቻ ጎተራዎች ግንባታ ጨረታ',
      en: 'Construction of Climate-Resilient Hermetic Metal & Concrete Grain Storage Silos in 6 Zones',
    },
    procuringEntity: {
      om: 'Biiroo Qonnaa Oromiyaa - Kutaa Injinariingii Qonnaa',
      am: 'የኦሮሚያ ግብርና ቢሮ - የግብርና ኢንጂነሪንግ ክፍል',
      en: 'Agricultural Infrastructure & Engineering Directorate',
    },
    category: 'construction',
    publishedDate: 'July 25, 2026',
    closingDate: 'September 18, 2026',
    closingTime: '11:00 AM EAT',
    daysRemaining: 34,
    bidSecurityETB: 'ETB 450,000.00 CPO',
    documentFeeETB: 'ETB 1,500.00',
    dossierSize: '18.2 MB (Architectural & BOQ Pack)',
    eligibility: {
      om: 'Kontaaktaroota ijaarsaa Sadarkaa GC/BC-4 fi isaa ol ta\'an.',
      am: 'ደረጃ 4 እና ከዚያ በላይ የሆኑ ህጋዊ የህንፃ ኮንትራክተሮች።',
      en: 'General / Building Contractors Grade 4 and above with past grain silo or warehouse track record.',
    },
    status: 'active',
    submissionLocation: {
      om: 'Finfinnee, Biiroo Qonnaa Oromiyaa, Gamoo B, Kutaa Injinariingii',
      am: 'አዲስ አበባ፣ የኦሮሚያ ግብርና ቢሮ፣ ህንፃ ለ፣ ኢንጂነሪንግ ቢሮ',
      en: 'Engineering Procurement Office, Block B, Floor 2, Finfinnee',
    },
    fileDownloadUrl: '#',
  },
];

export const comprehensiveMediaAssets: MediaAsset[] = [
  {
    id: 'media-1',
    title: {
      om: 'Mallattoo Rasmiyyaa fi Brand Guideline Biiroo Qonnaa Oromiyaa (Vector / High-Res PNG)',
      am: 'የኦሮሚያ ግብርና ቢሮ ይፋዊ አርማና የብራንድ መመሪያ',
      en: 'Official Oromia Agricultural Bureau Logo & Identity Press Kit (Vector / PNG / SVG)',
    },
    type: 'logo_kit',
    fileFormat: 'ZIP / SVG / PNG',
    fileSize: '6.4 MB',
    updatedDate: 'August 2026',
    downloadUrl: '#',
    description: {
      om: 'Mallattoo sadarkaa qabu halluuwwan Oromiyaa (Dimaa, Gurraacha, Magariisa, Booralee) fi qajeelfama fayyadama miidiyaaf.',
      am: 'የቢሮው ይፋዊ አርማዎች በከፍተኛ ጥራት ለጋዜጠኞችና ለህትመት ውጤቶች ዝግጁ ሆነው የተዘጋጁ።',
      en: 'High-resolution official logos, typography pairings, color palettes, and press badge guidelines for media and publication partners.',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'media-2',
    title: {
      om: 'Gabaasa Istaatistiksii fi Ragaa Oomisha Qonna Oromiyaa Bara 2025/2026 (Annual Factsheet)',
      am: 'የ2025/2026 የኦሮሚያ ግብርና አመታዊ የስታቲስቲክስ መረጃ ሰነድ',
      en: 'Oromia Agricultural Bureau Official Statistical Factsheet & Output Dossier 2025/2026',
    },
    type: 'factsheet',
    fileFormat: 'PDF',
    fileSize: '3.8 MB',
    updatedDate: 'July 2026',
    downloadUrl: '#',
    description: {
      om: 'Daataa guutuu hektaara qamadii klasteeraa, oomisha buna daldala alaa, foon fi aannan, fi jallisii bonaa godinaalee 21.',
      am: 'የስንዴ ክላስተር፣ የቡና ምርት፣ የወተትና የስጋ ልማት የተሟላ አመታዊ የስታቲስቲክስ መረጃ።',
      en: 'Verified regional crop yields, fertilizer consumption, mechanization hectares, livestock censuses, and agro-export revenues.',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'media-3',
    title: {
      om: 'Galmee Suuraalee Sadarkaa Ol\'aanaa (Field Harvest & Agri-Tech Photo Archive)',
      am: 'የከፍተኛ ጥራት የፎቶ ማህደር (የስንዴ ምርት፣ የመስኖ ልማትና ትራክተሮች)',
      en: 'Editorial High-Resolution Press Photo Gallery (Harvest, Solar Irrigation, Mechanization)',
    },
    type: 'photo_gallery',
    fileFormat: 'ZIP (45 Images, 300 DPI)',
    fileSize: '42.5 MB',
    updatedDate: 'August 2026',
    downloadUrl: '#',
    description: {
      om: 'Suuraalee qulqullina ol\'aanaa qaban kan miidiyaan, gaazexoonni fi qorattoonni bilisaan itti fayyadamuu danda\'an.',
      am: 'ለሚዲያ አካላትና ለጋዜጠኞች የተዘጋጁ 45 የፎቶግራፍ ስብስቦች በነፃ ማውረድ ይችላሉ።',
      en: 'Royalty-free editorial photos with photo credits for verified media outlets reporting on Oromia agricultural transformations.',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'media-4',
    title: {
      om: 'Waraqaa Qajeelfama Iyyaannoo Hayyama Gaazexeessummaa fi Miidiyaa (Media Accreditation Guide)',
      am: 'የጋዜጠኞችና የሚዲያ ፈቃድ ማመልከቻ መመሪያ ሰነድ',
      en: 'Bureau Media Accreditation Application Dossier & Field Access Protocol',
    },
    type: 'presentation',
    fileFormat: 'PDF / DOCX',
    fileSize: '1.5 MB',
    updatedDate: 'August 2026',
    downloadUrl: '#',
    description: {
      om: 'Ulaagaalee fi foormii iyyaannoo paasii miidiyaa waltajjiiwwan qonnaa fi daawwannaa dirree hordofuuf barbaachisu.',
      am: 'በክልሉ በሚካሄዱ የመስክ ጉብኝቶችና ዝግጅቶች ላይ ለመሳተፍ ለሚዲያ ባለሙያዎች የተዘጋጀ የፍቃድ ሰነድ።',
      en: 'Step-by-step accreditation requirements, press pass terms, and official interview request forms for national and global reporters.',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80',
  },
];

export const radioDispatches: RadioDispatchEpisode[] = [
  {
    id: 'rad-1',
    episodeNumber: 48,
    title: {
      om: 'Tarsiimoo Misooma Qamadii Bonaa fi Raabsa Paampii Soolaraa',
      am: 'የበጋ መስኖ ስንዴ ልማትና የፀሐይ ውኃ ፓምፖች ስርጭት',
      en: 'Dry-Season (Bona) Wheat Expansion & Solar Irrigation Fleet Deployment',
    },
    summary: {
      om: 'Qophii jallisii bonaa bara 2026/27, hektaara miliyoona 1.8 uwwisuu fi deeggarsa teeknooloojii paampii soolaaraa qonnaan bultootaaf kennamu.',
      am: 'በያዝነው በጀት ዓመት 1.8 ሚሊዮን ሄክታር መሬት በበጋ መስኖ ለማልማት የተያዘው እቅድና ለአርሶ አደሩ የሚደረግ የቴክኖሎጂ ድጋፍ።',
      en: 'In-depth audio interview analyzing target irrigation corridors in Arsi, East Shewa, and Rift Valley, featuring technical tips on moisture management.',
    },
    duration: '14:35 min',
    broadcastDate: 'August 10, 2026',
    host: {
      om: 'Ogeessa Miidiyaa Qonnaa Gadaa Tolaa',
      am: 'የግብርና ሚዲያ ባለሙያ ገዳ ቶላ',
      en: 'Senior Extension Broadcaster Gada Tola',
    },
    guest: {
      om: 'Dr. Dabaa Dabaloo (Hogganaa Daarektoreetii Jallisii)',
      am: 'ዶ/ር ዳባ ደበሎ (የመስኖ ልማት ዳይሬክተር)',
      en: 'Dr. Daba Debele (Head of Regional Irrigation Directorate)',
    },
    topicCategory: {
      om: 'Misooma Jallisii & Qilleensa',
      am: 'የመስኖ ልማትና አየር ንብረት',
      en: 'Irrigation & Smart Agronomy',
    },
    audioDurationSeconds: 875,
  },
  {
    id: 'rad-2',
    episodeNumber: 47,
    title: {
      om: 'Guddina Oomisha Buna Qulqullina Ol\'aanaa fi Gabaa Alaa',
      am: 'የልዩ ጥራት ቡና ምርት እድገትና የውጭ ገበያ ዝግጅት',
      en: 'Specialty Coffee Quality Protocols & Direct Export Channels',
    },
    summary: {
      om: 'Mala stumping muka bunaa dullomaa, qulqullina kellaa dhiqaa aadaa fi gabaa alaa Awurooppaa fi Eeshiyaa keessatti galii argamsiisuu.',
      am: 'የአረጁ የቡና ዛፎች ጉንደላ፣ የዘመናዊ እጥበት ጣቢያዎች አያያዝና የውጭ ገበያ ተደራሽነት ማብራሪያ።',
      en: 'Field experts from Jimma IQQO and Guji coffee cooperative unions discuss premium harvesting practices and direct trade pricing.',
    },
    duration: '12:50 min',
    broadcastDate: 'August 03, 2026',
    host: {
      om: 'Aaddee Boontuu Hundee (Raadiyoo Qonnaa)',
      am: 'ወ/ሮ ቦንቱ ሁንዴ (የግብርና ሬዲዮ)',
      en: 'Bontu Hunde (OAB Agricultural Radio)',
    },
    guest: {
      om: 'Obbo Mohaammad Aliyyii (Waldaa Bunaa Oromiyaa)',
      am: 'አቶ መሐመድ አሊ (የኦሮሚያ ቡና ህብረት ስራ ማህበር)',
      en: 'Obbo Mohammed Ali (Oromia Coffee Cooperative Federation)',
    },
    topicCategory: {
      om: 'Buna & Gabaa Alaa',
      am: 'ቡናና የውጭ ንግድ',
      en: 'Coffee & Agro-Export',
    },
    audioDurationSeconds: 770,
  },
];
