import type { AgriculturalProduct } from '../types/product';

/**
 * Local product catalog — editorial descriptions only.
 * No invented production statistics.
 * Image URLs follow the same Unsplash pattern already used by programs/news mocks;
 * ImageWithFallback provides branded placeholders if remote assets fail.
 */
export const PRODUCT_CATALOG: AgriculturalProduct[] = [
  {
    id: 'coffee',
    slug: 'coffee',
    name: { en: 'Coffee', om: 'Buna', am: 'ቡና' },
    shortDescription: {
      en: 'Explore Oromia’s coffee value chain, growing areas, processing opportunities and investment information.',
      om: 'Zanjira gatii bunaa Oromiyaa, naannoolee oomishaa, carraalee adeemsisuu fi odeeffannoo investimentii qoradhaa.',
      am: 'የኦሮሚያ የቡና እሴት ሰንሰለትን፣ የማምረቻ አካባቢዎችን፣ የማቀነባበር ዕድሎችን እና የኢንቨስትመንት መረጃን ያግኙ።',
    },
    overview: {
      en: 'Coffee is a defining agricultural product of Oromia. This page introduces the crop’s role in regional agriculture and guides you to related services and the public investment map.',
      om: 'Bunan oomisha qonnaa Oromiyaa keessatti adda ta’eedha. Fuula kun gahee midhaan kanaa qonna naannichaa keessatti ibsa, akkasumas gara tajaajilawwan walqabatanii fi kaartaa investimentii ummataatti geessa.',
      am: 'ቡና የኦሮሚያ ቁልፍ የግብርና ምርት ነው። ይህ ገጽ በክልሉ ግብርና ውስጥ ያለውን ሚና ያስተዋውቃል እና ወደ ተያያዥ አገልግሎቶችና የኢንቨስትመንት ካርታ ይመራዎታል።',
    },
    category: 'cash_crop',
    iconName: 'Coffee',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Coffee cherries and beans', om: 'Firiin bunaa fi bukkee', am: 'የቡና ፍሬ እና ባቄላ' },
      },
      {
        src: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Roasted coffee beans', om: 'Bukkee bunaa bilchaate', am: 'የተጠበሰ የቡና ባቄላ' },
      },
    ],
    investmentCommodityKey: 'coffee',
    relatedServiceIds: ['srv-ext', 'srv-market', 'srv-crop'],
  },
  {
    id: 'wheat',
    slug: 'wheat',
    name: { en: 'Wheat', om: 'Qamadii', am: 'ስንዴ' },
    shortDescription: {
      en: 'Discover wheat production areas, value-chain opportunities and available agricultural decision-support information.',
      om: 'Naannoolee oomisha qamadii, carraalee zanjira gatii fi odeeffannoo deeggarsa murteeffannoo qonnaa argadhaa.',
      am: 'የስንዴ ምርት አካባቢዎችን፣ የእሴት ሰንሰለት ዕድሎችን እና የግብርና ውሳኔ ድጋፍ መረጃን ያግኙ።',
    },
    overview: {
      en: 'Wheat is an important cereal across highland farming systems in Oromia. Use this page to explore related services and map-based investment context.',
      om: 'Qamadiin midhaan ijoo sirnoota qonnaa olaanaa Oromiyaa keessatti. Fuula kana fayyadamuun tajaajilawwan walqabatanii fi haala investimentii kaartaa irratti qoradhaa.',
      am: 'ስንዴ በኦሮሚያ ከፍተኛ ቦታ የእርሻ ስርዓቶች ውስጥ አስፈላጊ እህል ነው። ተያያዥ አገልግሎቶችንና በካርታ ላይ ያለ የኢንቨስትመንት አውድ ለማግኘት ይህን ገጽ ይጠቀሙ።',
    },
    category: 'cereal',
    iconName: 'Wheat',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Wheat field ready for harvest', om: 'Dirree qamadii haamuuuf qophaa’e', am: 'ለመከር ዝግጁ የስንዴ እርሻ' },
      },
      {
        src: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Harvested wheat grains', om: 'Cirii qamadii haamame', am: 'የተሰበሰበ ስንዴ' },
      },
    ],
    investmentCommodityKey: 'wheat',
    relatedServiceIds: ['srv-crop', 'srv-market', 'srv-ext'],
  },
  {
    id: 'maize',
    slug: 'maize',
    name: { en: 'Maize', om: 'Boqqoolloo', am: 'በቆሎ' },
    shortDescription: {
      en: 'Explore maize production, market relevance and regional agricultural opportunities.',
      om: 'Oomisha boqqoolloo, faayidaa gabaa fi carraalee qonnaa naannoo qoradhaa.',
      am: 'የበቆሎ ምርትን፣ የገበያ አግባብነትን እና የክልል ግብርና ዕድሎችን ያስሱ።',
    },
    overview: {
      en: 'Maize supports food systems and livestock feed across many Oromia zones. Learn how Bureau services and the investment map relate to this crop.',
      om: 'Boqqoolloon sirna nyaataa fi soorata beeyladaa godinaalee hedduu Oromiyaa keessatti deeggara. Tajaajilli Biiroo fi kaartaan investimentii midhaan kana waliin akka walqabatu hubadhaa.',
      am: 'በቆሎ በብዙ የኦሮሚያ ዞኖች የምግብ ስርዓትንና የእንስሳት መኖን ይደግፋል። የቢሮ አገልግሎቶችና የኢንቨስትመንት ካርታ ከዚህ ሰብል ጋር እንዴት እንደሚገናኙ ይወቁ።',
    },
    category: 'cereal',
    iconName: 'Corn',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Maize cob close-up', om: 'Boqqoolloo dhiyeenyaan', am: 'በቆሎ በቅርብ' },
      },
    ],
    investmentCommodityKey: 'maize',
    relatedServiceIds: ['srv-crop', 'srv-ext', 'srv-inputs'],
  },
  {
    id: 'teff',
    slug: 'teff',
    name: { en: 'Teff', om: 'Xaafii', am: 'ጤፍ' },
    shortDescription: {
      en: 'Learn about teff as a staple cereal and explore related Bureau guidance and investment context.',
      om: 'Xaafii akka midhaan nyaataa ijootti hubadhaa; gorsa Biiroo fi haala investimentii qoradhaa.',
      am: 'ጤፍን እንደ ዋና እህል ይወቁ እና ተያያዥ የቢሮ መመሪያንና የኢንቨስትመንት አውድ ያስሱ።',
    },
    overview: {
      en: 'Teff is central to many household food systems. This page provides an editorial overview and links to services and the investment portal.',
      om: 'Xaafiin sirnoota nyaataa maatii hedduu keessatti ijoo dha. Fuula kun ibsa editooriyaalaa fi geessituu gara tajaajilaa fi portalii investimentiitti kenna.',
      am: 'ጤፍ በብዙ የቤተሰብ የምግብ ስርዓቶች ውስጥ ማዕከላዊ ነው። ይህ ገጽ አርታኢ አጠቃላይ እይታ እና ወደ አገልግሎቶችና የኢንቨስትመንት ፖርታል አገናኞችን ይሰጣል።',
    },
    category: 'cereal',
    iconName: 'Wheat',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Grain field representing teff cultivation', om: 'Dirree midhaanii xaafii fakkeessu', am: 'ጤፍን የሚወክል የእህል እርሻ' },
      },
    ],
    investmentCommodityKey: 'teff',
    relatedServiceIds: ['srv-crop', 'srv-market'],
  },
  {
    id: 'barley',
    slug: 'barley',
    name: { en: 'Barley', om: 'Garbuu', am: 'ገብስ' },
    shortDescription: {
      en: 'Explore barley’s place in highland cereal systems and related agricultural support services.',
      om: 'Bakka garbuu sirna midhaanii olaanaa keessatti qabatuu fi tajaajilawwan deeggarsa qonnaa walqabatan qoradhaa.',
      am: 'ገብስ በከፍተኛ ቦታ የእህል ስርዓቶች ውስጥ ያለውን ሚና እና ተያያዥ የግብርና ድጋፍ አገልግሎቶችን ያስሱ።',
    },
    overview: {
      en: 'Barley contributes to food and feed uses in cooler highland areas. Browse related services or open the investment map for geographic context.',
      om: 'Garbuun naannoolee qorraa olaanaa keessatti fayyadama nyaataa fi soorataaf gumaacha. Tajaajilawwan walqabatan daawwadhaa ykn haala geographyaf kaartaa investimentii banaa.',
      am: 'ገብስ በቀዝቃዛ ከፍተኛ ቦታዎች ለምግብና መኖ አስተዋፅኦ ያደርጋል። ተያያዥ አገልግሎቶችን ይመልከቱ ወይም ለጂኦግራፊያዊ አውድ የኢንቨስትመንት ካርታ ይክፈቱ።',
    },
    category: 'cereal',
    iconName: 'Wheat',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Barley grain field', om: 'Dirree garbuu', am: 'የገብስ እርሻ' },
      },
    ],
    investmentCommodityKey: 'barley',
    relatedServiceIds: ['srv-crop', 'srv-ext'],
  },
  {
    id: 'sesame',
    slug: 'sesame',
    name: { en: 'Sesame', om: 'Salixii', am: 'ሰሊጥ' },
    shortDescription: {
      en: 'Review sesame as an oilseed crop and find links to market and extension support.',
      om: 'Salixii akka midhaan zayitii qoradhaa; geessituu gara deeggarsa gabaa fi eksteenshinii argadhaa.',
      am: 'ሰሊጥን እንደ የዘይት ሰብል ይመልከቱ እና ወደ ገበያና ኤክስቴንሽን ድጋፍ አገናኞችን ያግኙ።',
    },
    overview: {
      en: 'Sesame is part of Oromia’s oilseed landscape. This overview connects you to Bureau services and investment map navigation.',
      om: 'Salixiín midhaan zayitii Oromiyaa keessatti argama. Ibsi kun gara tajaajila Biiroo fi navigation kaartaa investimentiitti isin geessa.',
      am: 'ሰሊጥ የኦሮሚያ የዘይት ሰብሎች አካል ነው። ይህ አጠቃላይ እይታ ወደ የቢሮ አገልግሎቶችና የኢንቨስትመንት ካርታ ያገናኝዎታል።',
    },
    category: 'oilseed',
    iconName: 'Sprout',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Sesame seeds', om: 'Sanyii salixii', am: 'የሰሊጥ ዘር' },
      },
    ],
    investmentCommodityKey: 'sesame',
    relatedServiceIds: ['srv-market', 'srv-crop'],
  },
  {
    id: 'soybeans',
    slug: 'soybeans',
    name: { en: 'Soybeans', om: 'Soybean', am: 'ሶያ ባቄላ' },
    shortDescription: {
      en: 'Explore soybean opportunities across production, processing interest and related advisory services.',
      om: 'Carraalee soybean oomishaa, adeemsisuu fi tajaajila gorsa walqabate qoradhaa.',
      am: 'በምርት፣ በማቀነባበር ፍላጎት እና ተያያዥ የምክር አገልግሎቶች የሶያ ባቄላ ዕድሎችን ያስሱ።',
    },
    overview: {
      en: 'Soybeans support protein and oilseed interest in regional agriculture. Use Bureau services and the map for further exploration.',
      om: 'Soybean fedhii pirootiinii fi midhaan zayitii qonna naannoo keessatti deeggara. Qorannoo dabalataaf tajaajila Biiroo fi kaartaa fayyadamaa.',
      am: 'ሶያ ባቄላ በክልሉ ግብርና ውስጥ የፕሮቲንና የዘይት ሰብል ፍላጎትን ይደግፋል። ለተጨማሪ መርምር የቢሮ አገልግሎቶችንና ካርታውን ይጠቀሙ።',
    },
    category: 'oilseed',
    iconName: 'Bean',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1607620817886-725192697b1b?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Soybean plants in field', om: 'Biqiltuu soybean dirree keessa', am: 'በእርሻ ውስጥ የሶያ ባቄላ ተክሎች' },
      },
    ],
    investmentCommodityKey: 'soybeans',
    relatedServiceIds: ['srv-crop', 'srv-market', 'srv-inputs'],
  },
  {
    id: 'avocado',
    slug: 'avocado',
    name: { en: 'Avocado', om: 'Avokaadoo', am: 'አቮካዶ' },
    shortDescription: {
      en: 'Discover avocado as a horticultural crop with processing and market-pathway information.',
      om: 'Avokaadoo akka midhaan horticulture fi odeeffannoo karaa adeemsisuu fi gabaa qoradhaa.',
      am: 'አቮካዶን እንደ የአትክልትና ፍራፍሬ ሰብል ከማቀነባበርና የገበያ መንገድ መረጃ ጋር ያግኙ።',
    },
    overview: {
      en: 'Avocado sits within horticulture development conversations in Oromia. Related services and the investment map provide next steps.',
      om: 'Avokaadoon marii misooma horticulture Oromiyaa keessatti argama. Tajaajilawwan walqabatanii fi kaartaan investimentii tarkaanfii ittaanu kenna.',
      am: 'አቮካዶ በኦሮሚያ የአትክልትና ፍራፍሬ ልማት ውይይቶች ውስጥ ይገኛል። ተያያዥ አገልግሎቶችና የኢንቨስትመንት ካርታ ቀጣይ እርምጃዎችን ይሰጣሉ።',
    },
    category: 'horticulture',
    iconName: 'Apple',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Fresh avocados', om: 'Avokaadoo haaraa', am: 'ትኩስ አቮካዶ' },
      },
    ],
    investmentCommodityKey: 'avocado',
    relatedServiceIds: ['srv-crop', 'srv-market'],
  },
  {
    id: 'potato',
    slug: 'potato',
    name: { en: 'Potato', om: 'Dinnicha', am: 'ድንች' },
    shortDescription: {
      en: 'Explore potato production guidance pathways and related crop support services.',
      om: 'Karaalee gorsa oomisha dinnichaa fi tajaajila deeggarsa midhaan walqabate qoradhaa.',
      am: 'የድንች ምርት መመሪያ መንገዶችን እና ተያያዥ የሰብል ድጋፍ አገልግሎቶችን ያስሱ።',
    },
    overview: {
      en: 'Potato is a key root crop for many highland communities. This page links editorial context with Bureau services and investment navigation.',
      om: 'Dinnichi midhaan hiddaa ijoo hawaasota olaanaa hedduutiif. Fuula kun haala editooriyaalaa tajaajila Biiroo fi navigation investimentiitti hidha.',
      am: 'ድንች ለብዙ ከፍተኛ ቦታ ማህበረሰቦች ቁልፍ የሥር ሰብል ነው። ይህ ገጽ አርታኢ አውድን ከቢሮ አገልግሎቶችና የኢንቨስትመንት አሰሳ ጋር ያገናኛል።',
    },
    category: 'horticulture',
    iconName: 'Sprout',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Harvested potatoes', om: 'Dinnicha haamame', am: 'የተሰበሰበ ድንች' },
      },
    ],
    investmentCommodityKey: 'potato',
    relatedServiceIds: ['srv-crop', 'srv-ext', 'srv-inputs'],
  },
  {
    id: 'horticulture',
    slug: 'horticulture',
    name: { en: 'Horticulture', om: 'Horticulture', am: 'አትክልትና ፍራፍሬ' },
    shortDescription: {
      en: 'Browse horticulture themes spanning fruits, vegetables and related market services.',
      om: 'Mata dureewwan horticulture firiinsaa, kuduraa fi tajaajila gabaa walqabate daawwadhaa.',
      am: 'ፍራፍሬ፣ አትክልት እና ተያያዥ የገበያ አገልግሎቶችን የሚያካትቱ የአትክልትና ፍራፍሬ ጭብጦችን ይመልከቱ።',
    },
    overview: {
      en: 'Horticulture covers a wide set of fruit and vegetable systems. Use this overview to reach related services and the investment map.',
      om: 'Horticulture sirnoota kuduraa fi firiinsaa bal’aa hammata. Ibsa kana fayyadamuun gara tajaajilaa fi kaartaa investimentiitti geessi.',
      am: 'አትክልትና ፍራፍሬ ሰፊ የፍራፍሬና አትክልት ስርዓቶችን ይሸፍናል። ወደ ተያያዥ አገልግሎቶችና የኢንቨስትመንት ካርታ ለመድረስ ይህን አጠቃላይ እይታ ይጠቀሙ።',
    },
    category: 'horticulture',
    iconName: 'Leaf',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Fresh horticultural produce', om: 'Oomisha horticulture haaraa', am: 'ትኩስ የአትክልትና ፍራፍሬ ምርት' },
      },
    ],
    investmentCommodityKey: 'horticulture',
    relatedServiceIds: ['srv-crop', 'srv-market', 'srv-irrigation'],
  },
  {
    id: 'livestock',
    slug: 'livestock',
    name: { en: 'Livestock', om: 'Beeyladaa', am: 'እንስሳት' },
    shortDescription: {
      en: 'Explore livestock systems and veterinary-related agricultural services available through the Bureau.',
      om: 'Sirna beeyladaa fi tajaajila qonnaa fayyaa beeyladaa Biiroon kenname qoradhaa.',
      am: 'የእንስሳት ስርዓቶችን እና በቢሮ በኩል የሚገኙ ተያያዥ የእንስሳት ጤና አገልግሎቶችን ያስሱ።',
    },
    overview: {
      en: 'Livestock remains central to livelihoods across Oromia. This page highlights related services and investment navigation pathways.',
      om: 'Beeyladni jireenya Oromiyaa keessatti ijoo ta’ee jira. Fuula kun tajaajilawwan walqabatanii fi karaalee navigation investimentii calaqqisiisa.',
      am: 'እንስሳት በመላው ኦሮሚያ ለኑሮ ማዕከላዊ ሆኖ ይቀጥላል። ይህ ገጽ ተያያዥ አገልግሎቶችንና የኢንቨስትመንት አሰሳ መንገዶችን ያጎላል።',
    },
    category: 'livestock',
    iconName: 'Beef',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Livestock in pastoral landscape', om: 'Beeyladaa lafa horsiisotaa keessa', am: 'በእረኛ መልክዓ ምድር ላይ እንስሳት' },
      },
    ],
    investmentCommodityKey: 'livestock',
    relatedServiceIds: ['srv-livestock', 'srv-ext', 'srv-market'],
  },
  {
    id: 'dairy',
    slug: 'dairy',
    name: { en: 'Dairy', om: 'Aannan', am: 'የወተት ምርት' },
    shortDescription: {
      en: 'Learn about dairy value-chain themes and related livestock and market support services.',
      om: 'Mata dureewwan zanjira gatii aannanii fi tajaajila deeggarsa beeyladaa fi gabaa walqabate hubadhaa.',
      am: 'የወተት እሴት ሰንሰለት ጭብጦችን እና ተያያዥ የእንስሳትና ገበያ ድጋፍ አገልግሎቶችን ይወቁ።',
    },
    overview: {
      en: 'Dairy connects livestock production with processing and market pathways. Explore Bureau services and the investment map for next steps.',
      om: 'Aannan oomisha beeyladaa karaa adeemsisuu fi gabaatti hidha. Tarkaanfii ittaanuuf tajaajila Biiroo fi kaartaa investimentii qoradhaa.',
      am: 'የወተት ምርት የእንስሳት ምርትን ከማቀነባበርና የገበያ መንገዶች ጋር ያገናኛል። ለቀጣይ እርምጃዎች የቢሮ አገልግሎቶችንና የኢንቨስትመንት ካርታን ያስሱ።',
    },
    category: 'dairy',
    iconName: 'Milk',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=1200&q=80',
        alt: { en: 'Fresh dairy milk', om: 'Aannan haaraa', am: 'ትኩስ ወተት' },
      },
    ],
    investmentCommodityKey: 'dairy',
    relatedServiceIds: ['srv-livestock', 'srv-market'],
  },
];
