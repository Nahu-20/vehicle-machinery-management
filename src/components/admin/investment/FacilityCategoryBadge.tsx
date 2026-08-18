import React from 'react';
import {
  Warehouse,
  Snowflake,
  Factory,
  Droplets,
  Zap,
  Route,
  PackageCheck,
  Store,
  FlaskConical,
  Stethoscope,
  Sprout,
  Truck,
  Building,
  Layers,
} from 'lucide-react';
import { InfrastructureCategory } from '../../../types/investment';

export interface CategoryMeta {
  key: InfrastructureCategory;
  label: {
    en: string;
    om: string;
    am: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const INFRASTRUCTURE_CATEGORIES: CategoryMeta[] = [
  {
    key: 'processing',
    label: {
      en: 'Agro-Processing Plant',
      om: 'Warshaa Qunnamtii Qonnaa',
      am: 'የግብርና ማቀነባበሪያ ፋብሪካ',
    },
    icon: Factory,
    color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800',
  },
  {
    key: 'warehouse',
    label: {
      en: 'Warehouse & Silo',
      om: 'Kuusaa & Silo',
      am: 'መጋዘን እና ሲሎ',
    },
    icon: Warehouse,
    color: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-800',
  },
  {
    key: 'cold_storage',
    label: {
      en: 'Cold Storage Unit',
      om: 'Kuusaa Qabbaneessituu',
      am: 'ቀዝቃዛ ማከማቻ ክፍል',
    },
    icon: Snowflake,
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/60 dark:border-cyan-800',
  },
  {
    key: 'irrigation',
    label: {
      en: 'Irrigation Scheme',
      om: 'Ijaarsa Jallisiisaa',
      am: 'የመስኖ ልማት ፕሮጀክት',
    },
    icon: Droplets,
    color: 'text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-300 dark:bg-teal-950/60 dark:border-teal-800',
  },
  {
    key: 'collection_center',
    label: {
      en: 'Aggregation & Collection Center',
      om: 'Wiirtuu Walitti Qabiinsaa',
      am: 'የሰብል መሰብሰቢያ ማዕከል',
    },
    icon: PackageCheck,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800',
  },
  {
    key: 'market',
    label: {
      en: 'Commodity Market',
      om: 'Gabaa Oomishaalee',
      am: 'የምርት ገበያ ማዕከል',
    },
    icon: Store,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-800',
  },
  {
    key: 'livestock_market',
    label: {
      en: 'Livestock Market & Yard',
      om: 'Gabaa Horii & Dachee',
      am: 'የእንስሳት ገበያ እና ግቢ',
    },
    icon: Store,
    color: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/60 dark:border-orange-800',
  },
  {
    key: 'electricity',
    label: {
      en: 'Power Grid & Substation',
      om: 'Tajaajila Humna Ibsaa',
      am: 'የኤሌክትሪክ ኃይል እና ማከፋፈያ',
    },
    icon: Zap,
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950/60 dark:border-yellow-800',
  },
  {
    key: 'road',
    label: {
      en: 'Road & Transport Corridor',
      om: 'Daandii & Sarara Geejjibaa',
      am: 'መንገድ እና የትራንስፖርት ኮሪዶር',
    },
    icon: Route,
    color: 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700',
  },
  {
    key: 'laboratory',
    label: {
      en: 'Soil & Quality Testing Lab',
      om: 'Laaboraatoorii Qulqullinaa',
      am: 'የአፈር እና የጥራት መመርመሪያ ላብራቶሪ',
    },
    icon: FlaskConical,
    color: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/60 dark:border-purple-800',
  },
  {
    key: 'veterinary',
    label: {
      en: 'Veterinary Clinic & Health Post',
      om: 'Kilinika Fayyaa Beeyladaa',
      am: 'የእንስሳት ጤና ክሊኒክ',
    },
    icon: Stethoscope,
    color: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800',
  },
  {
    key: 'input_distribution',
    label: {
      en: 'Input Distribution Hub (Seed/Fertilizer)',
      om: 'Giddu-gala Galtee Qonnaa',
      am: 'የግብርና ግብዓት ማከፋፈያ ማዕከል',
    },
    icon: Sprout,
    color: 'text-lime-700 bg-lime-50 border-lime-200 dark:text-lime-300 dark:bg-lime-950/60 dark:border-lime-800',
  },
  {
    key: 'logistics',
    label: {
      en: 'Logistics Terminal & Freight Center',
      om: "Wiirtuu Lojistiksii & Fe'iinsaa",
      am: 'የሎጂስቲክስ ተርሚናል እና ጭነት ማዕከል',
    },
    icon: Truck,
    color: 'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/60 dark:border-sky-800',
  },
  {
    key: 'other',
    label: {
      en: 'Other Infrastructure',
      om: 'Bu\'uuraalee Misoomaa Kan Biraa',
      am: 'ሌሎች የመሠረተ ልማት አውታሮች',
    },
    icon: Building,
    color: 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800/60 dark:border-slate-700',
  },
];

export const CATEGORY_MAP: Record<string, CategoryMeta> = Object.fromEntries(
  INFRASTRUCTURE_CATEGORIES.map((c) => [c.key, c])
);

interface FacilityCategoryBadgeProps {
  category: string;
  lang?: 'en' | 'om' | 'am';
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export function FacilityCategoryBadge({
  category,
  lang = 'en',
  showIcon = true,
  size = 'sm',
}: FacilityCategoryBadgeProps) {
  const normKey = category === 'cold-storage' ? 'cold_storage' : category;
  const meta = CATEGORY_MAP[normKey] || {
    key: 'other',
    label: { en: category || 'Other', om: category || 'Kan Biraa', am: category || 'ሌላ' },
    icon: Layers,
    color: 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700',
  };

  const IconComp = meta.icon;
  const labelText = meta.label[lang] || meta.label.en;

  const sizeClasses =
    size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-2 py-0.5 text-[11px] gap-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${meta.color} ${sizeClasses} whitespace-nowrap`}
    >
      {showIcon && <IconComp className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />}
      <span>{labelText}</span>
    </span>
  );
}
