import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Network } from 'lucide-react';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { AboutSectionHero } from '../../components/about/AboutSectionHero';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import {
  listOrgNodes,
  getOrgChildren,
  listServiceChain,
} from '../../services/aboutService';
import type { AboutOrgNode, AboutServiceChainStep } from '../../types/about';
import coffeeImg from '../../assets/images/oromia_coffee_harvest_1785782724559.jpg';

const REACH_TYPES = new Set(['zone', 'woreda', 'kebele', 'extension', 'farmer']);

export const StructurePage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const [nodes, setNodes] = useState<AboutOrgNode[]>([]);
  const [chain, setChain] = useState<AboutServiceChainStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [mobilePath, setMobilePath] = useState<string[]>([]);
  const [treeReady, setTreeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listOrgNodes(), listServiceChain()])
      .then(([orgNodes, steps]) => {
        if (cancelled) return;
        setNodes(orgNodes);
        setChain(steps);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const roots = useMemo(() => getOrgChildren(nodes, null), [nodes]);

  useEffect(() => {
    if (loading || treeReady || nodes.length === 0) return;
    const rootList = getOrgChildren(nodes, null);
    setSelectedId(rootList[0]?.id ?? nodes[0]?.id ?? null);
    const initial = new Set<string>();
    rootList.forEach((r) => initial.add(r.id));
    const firstChildren = rootList[0] ? getOrgChildren(nodes, rootList[0].id) : [];
    firstChildren.forEach((c) => initial.add(c.id));
    setExpandedIds(initial);
    setTreeReady(true);
  }, [loading, nodes, treeReady]);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTreeNode = (node: AboutOrgNode, depth = 0) => {
    const children = getOrgChildren(nodes, node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <li key={node.id} className="relative">
        <div
          className={`flex items-stretch gap-1 rounded-lg ${
            isSelected
              ? 'bg-[#E8F5EC] dark:bg-[#14241a] ring-1 ring-[#087A4B]/40 dark:ring-[#74d62c]/35'
              : ''
          }`}
          style={{ marginLeft: depth * 12 }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(node.id)}
              className="shrink-0 p-2 text-[#56635B] dark:text-[#a5aba6] hover:text-[#063D2A] dark:hover:text-[#74d62c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded"
              aria-expanded={isExpanded}
              aria-label={getLocalizedText(node.title)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          ) : (
            <span className="w-8 shrink-0" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => setSelectedId(node.id)}
            className="flex-1 text-left py-2.5 pr-3 text-sm font-semibold text-[#0D1C13] dark:text-[#f5f6f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded"
            aria-current={isSelected ? 'true' : undefined}
          >
            {getLocalizedText(node.title)}
            {node.isPlaceholder && (
              <span className="ml-2 text-[9px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a]">
                TBD
              </span>
            )}
          </button>
        </div>
        {hasChildren && isExpanded && (
          <ul className="mt-0.5 space-y-0.5" role="group">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const mobileCurrentParent =
    mobilePath.length === 0 ? null : mobilePath[mobilePath.length - 1];
  const mobileNodes =
    mobilePath.length === 0 ? roots : getOrgChildren(nodes, mobileCurrentParent!);
  const mobileCurrentNode =
    mobilePath.length === 0
      ? null
      : nodes.find((n) => n.id === mobilePath[mobilePath.length - 1]) ?? null;

  const reachNodes = nodes.filter((n) => REACH_TYPES.has(n.type));
  const reachSteps =
    chain.length > 0
      ? chain
      : reachNodes.map((n, i) => ({
          id: n.id,
          title: n.title,
          description: n.description ?? n.title,
          displayOrder: i + 1,
        }));

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_structure') },
      ]}
    >
      <AboutSectionHero
        eyebrow={t('about_nav_structure')}
        title={t('about_page_structure_title')}
        subtitle={t('about_page_structure_subtitle')}
        imageSrc={coffeeImg}
        imageAlt={getLocalizedText({
          en: 'Coffee harvest in Oromia',
          om: 'Haala bunaa Oromiyaa',
          am: 'በኦሮሚያ የቡና መከር',
        })}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        <p
          role="note"
          className="rounded-xl border border-[#D7A928]/35 bg-[#FFF8E8] dark:bg-[#1a1810] dark:border-[#e4ad37]/25 px-4 py-3 text-sm text-[#5C4A12] dark:text-[#e8d9a8]"
        >
          {t('about_org_disclaimer')}
        </p>

        {loading ? (
          <p className="text-sm text-[#56635B]">Loading…</p>
        ) : nodes.length === 0 ? (
          <p className="text-sm text-[#56635B]">{t('about_placeholder_banner')}</p>
        ) : (
          <>
            <section
              className="hidden md:grid md:grid-cols-12 gap-6"
              aria-labelledby="org-tree-heading"
            >
              <h2 id="org-tree-heading" className="sr-only">
                {t('about_page_structure_title')}
              </h2>
              <div className="md:col-span-5 lg:col-span-4 rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#087A4B] dark:text-[#74d62c] mb-3 px-1">
                  {getLocalizedText({
                    en: 'Organization tree',
                    om: 'Mukaa caaseffamaa',
                    am: 'የድርጅት ዛፍ',
                  })}
                </p>
                <ul role="tree" className="space-y-0.5">
                  {roots.map((r) => renderTreeNode(r))}
                </ul>
              </div>
              <div className="md:col-span-7 lg:col-span-8 rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-6 sm:p-8 min-h-[280px]">
                <AnimatePresence mode="wait">
                  {selected ? (
                    <motion.div
                      key={selected.id}
                      initial={isReducedMotion ? undefined : { opacity: 0, y: 8 }}
                      animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={isReducedMotion ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Network
                          className="h-5 w-5 text-[#087A4B] dark:text-[#74d62c]"
                          aria-hidden="true"
                        />
                        <h3 className="text-xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]">
                          {getLocalizedText(selected.title)}
                        </h3>
                        {selected.isPlaceholder && (
                          <span className="text-[10px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
                            TBD
                          </span>
                        )}
                      </div>
                      {selected.description && (
                        <p className="text-[#56635B] dark:text-[#a5aba6] leading-relaxed">
                          {getLocalizedText(selected.description)}
                        </p>
                      )}
                      {selected.responsibilities && selected.responsibilities.length > 0 && (
                        <ul className="mt-4 space-y-2 list-disc list-inside text-sm text-[#56635B] dark:text-[#a5aba6]">
                          {selected.responsibilities.map((r, i) => (
                            <li key={i}>{getLocalizedText(r)}</li>
                          ))}
                        </ul>
                      )}
                      {selected.href && (
                        <Link
                          to={selected.href}
                          className="mt-5 inline-flex text-sm font-semibold text-[#087A4B] dark:text-[#74d62c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded"
                        >
                          {getLocalizedText({
                            en: 'Related page',
                            om: 'Fuula walitti dhufeenya qabu',
                            am: 'ተዛማጅ ገጽ',
                          })}
                          <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                        </Link>
                      )}
                    </motion.div>
                  ) : (
                    <p className="text-[#56635B] dark:text-[#a5aba6]">
                      {getLocalizedText({
                        en: 'Select a node to view details.',
                        om: 'Bal\'ina ilaaluuf noodii filadhu.',
                        am: 'ዝርዝር ለማየት ኖድ ይምረጡ።',
                      })}
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </section>

            <section className="md:hidden space-y-4" aria-labelledby="org-mobile-heading">
              <h2
                id="org-mobile-heading"
                className="text-lg font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]"
              >
                {t('about_page_structure_title')}
              </h2>
              {mobilePath.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMobilePath((p) => p.slice(0, -1))}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#087A4B] dark:text-[#74d62c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                  {getLocalizedText({
                    en: 'Back',
                    om: 'Deebi\'i',
                    am: 'ተመለስ',
                  })}
                </button>
              )}
              {mobileCurrentNode && (
                <article className="rounded-xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-4">
                  <h3 className="font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
                    {getLocalizedText(mobileCurrentNode.title)}
                  </h3>
                  {mobileCurrentNode.description && (
                    <p className="mt-2 text-sm text-[#56635B] dark:text-[#a5aba6]">
                      {getLocalizedText(mobileCurrentNode.description)}
                    </p>
                  )}
                </article>
              )}
              <ul className="space-y-2">
                {mobileNodes.map((node) => {
                  const kids = getOrgChildren(nodes, node.id);
                  return (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(node.id);
                          if (kids.length > 0) setMobilePath((p) => [...p, node.id]);
                        }}
                        className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] px-4 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B]"
                      >
                        <span className="font-semibold text-sm text-[#0D1C13] dark:text-[#f5f6f3]">
                          {getLocalizedText(node.title)}
                        </span>
                        {kids.length > 0 && (
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-[#56635B] dark:text-[#a5aba6]"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}

        {!loading && reachSteps.length > 0 && (
          <section aria-labelledby="reach-farmer-heading" className="space-y-6">
            <div>
              <h2
                id="reach-farmer-heading"
                className="text-xl sm:text-2xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]"
              >
                {getLocalizedText({
                  en: 'How government reaches the farmer',
                  om: 'Akkaataa mootummaan qonnaan bultaa ga\'u',
                  am: 'መንግሥት አርሶ አደሩን እንዴት እንደሚደርስ',
                })}
              </h2>
              <p className="mt-2 text-sm text-[#56635B] dark:text-[#a5aba6] max-w-2xl">
                {getLocalizedText({
                  en: 'Conceptual service delivery chain from policy to household producers.',
                  om: 'Cimdaa kenna tajaajilaa imaammataa irraa hanga oomistoota manaatti.',
                  am: 'ከፖሊሲ እስከ ቤተሰብ አምራቾች የአገልግሎት ሰንሰለት ጽንሰ-ሐሳብ።',
                })}
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {reachSteps.map((step, index) => (
                <motion.li
                  key={step.id}
                  initial={isReducedMotion ? undefined : { opacity: 0, y: 10 }}
                  whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.3, delay: isReducedMotion ? 0 : index * 0.04 }}
                  className="rounded-xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-4"
                >
                  <span className="text-xs font-extrabold text-[#087A4B] dark:text-[#74d62c]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-1.5 font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
                    {getLocalizedText(step.title)}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#56635B] dark:text-[#a5aba6] leading-relaxed">
                    {getLocalizedText(step.description)}
                  </p>
                </motion.li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </AboutPageShell>
  );
};
