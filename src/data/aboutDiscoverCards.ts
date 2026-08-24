/**
 * Static Discover OAB cards (route map). Copy is localized; not institutional claims.
 */

import type { AboutDiscoverCard, AboutLocalizedText } from '../types/about';

const L = (en: string, om: string, am: string): AboutLocalizedText => ({ en, om, am });

export const aboutDiscoverCards: AboutDiscoverCard[] = [
  {
    id: 'history',
    title: L('Our History', 'Seenaa Keenya', 'ታሪካችን'),
    description: L(
      'Institutional growth and transformation over time.',
      'Guddina fi jijjiirama dhaabbataa yeroo keessa.',
      'በጊዜ ሂደት የተቋም እድገትና ለውጥ።',
    ),
    href: '/about/history',
    iconName: 'History',
    displayOrder: 1,
  },
  {
    id: 'mandate',
    title: L('Mandate, Mission & Vision', 'Aangoo, Ergama & Mul\'ata', 'ተልዕኮ፣ ራዕይና ስልጣን'),
    description: L(
      'Why we exist and where we are headed.',
      'Maaliif jirraa fi eessa deema.',
      'ለምን እንደምንኖር እና ወዴት እንደምንሄድ።',
    ),
    href: '/about/mandate',
    iconName: 'Target',
    displayOrder: 2,
  },
  {
    id: 'structure',
    title: L('Organizational Structure', 'Caaseffama Dhaabbataa', 'የድርጅት መዋቅር'),
    description: L(
      'How the bureau is organized to serve Oromia.',
      'Akkaataa biiroon tajaajila Oromiyaa qindeessuu.',
      'ቢሮው ኦሮሚያን ለማገልገል እንዴት እንደተደራጀ።',
    ),
    href: '/about/structure',
    iconName: 'Network',
    displayOrder: 3,
  },
  {
    id: 'leadership',
    title: L('Leadership', 'Hooggansa', 'አመራር'),
    description: L(
      'Bureau leadership and senior management profiles.',
      'Piroofaayilii hooggansa biiroo fi hoogganoota olaanoo.',
      'የቢሮ አመራር እና ከፍተኛ አስተዳደር መገለጫዎች።',
    ),
    href: '/about/leadership',
    iconName: 'Users',
    displayOrder: 4,
  },
  {
    id: 'departments',
    title: L('Departments & Directorates', 'Kutaa fi Daayreektoreetota', 'ዳይሬክቶሬቶች'),
    description: L(
      'Technical directorates delivering sector programs.',
      'Daayreektoreetonni teeknikaa sagantaalee sektaraa kenna.',
      'የዘርፍ ፕሮግራሞችን የሚያቀርቡ ቴክኒካል ዳይሬክቶሬቶች።',
    ),
    href: '/about/departments',
    iconName: 'Building2',
    displayOrder: 5,
  },
  {
    id: 'serve',
    title: L('How We Serve Oromia', 'Akkaataa Tajaajila Oromiyaa', 'ኦሮሚያን እንዴት እናገለግላለን'),
    description: L(
      'From policy to development agents and farmers.',
      'Tarsiimoo irraa hanga ogeessota misoomaa fi qonnaan bultootatti.',
      'ከፖሊሲ እስከ የልማት ወኪሎች እና አርሶ አደሮች።',
    ),
    href: '/about/how-we-serve',
    iconName: 'Route',
    displayOrder: 6,
  },
  {
    id: 'stats',
    title: L('OAB at a Glance', 'Biiroo Sacuu', 'ቢሮው በአጭሩ'),
    description: L(
      'Coverage and operations indicators (verified data pending).',
      'Agarsiiftuu tajaajilaa (odeeffannoon mirkanaa\'e eeggataa).',
      'የሽፋን እና የአሠራር አመላካቾች (የተረጋገጠ መረጃ በመጠባበቅ ላይ)።',
    ),
    href: '/about/statistics',
    iconName: 'BarChart3',
    displayOrder: 7,
  },
  {
    id: 'docs',
    title: L('Strategic Documents', 'Sanadoota Tarsiimoo', 'ስትራቴጂክ ሰነዶች'),
    description: L(
      'Strategies, policies, and institutional publications.',
      'Tarsiimoonni, imaammatonni fi maxxansa dhaabbataa.',
      'ስትራቴጂዎች፣ ፖሊሲዎች እና የተቋም ህትመቶች።',
    ),
    href: '/about/documents',
    iconName: 'FileText',
    displayOrder: 8,
  },
];
