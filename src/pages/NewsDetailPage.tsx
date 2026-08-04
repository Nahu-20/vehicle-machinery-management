import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Building2,
  Share2,
  Printer,
  ChevronLeft,
  Tag,
  CheckCircle2,
  Info,
  ArrowRight,
  Bookmark,
  ExternalLink,
  Quote,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { mockNews } from '../data/mockData';
import { NewsArticle, NewsContentBlock, LocalizedText } from '../types';

export const NewsDetailPage: React.FC = () => {
  const { newsSlug } = useParams<{ newsSlug: string }>();
  const navigate = useNavigate();
  const { language, t, getLocalizedText } = useLanguage();

  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Find article by slug or fallback to id for backward compatibility
  const article = mockNews.find(
    (item) => item.slug === newsSlug || item.id === newsSlug
  );

  // Scroll to top on route / slug change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [newsSlug]);

  if (!article) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('news_not_found_title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {t('news_not_found_desc')}
        </p>
        <Link
          to="/news"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('news_back_to_news')}
        </Link>
      </div>
    );
  }

  // Get localized strings for article fields
  const titleText = typeof article.title === 'string' ? article.title : getLocalizedText(article.title);
  const excerptText = typeof article.excerpt === 'string' ? article.excerpt : getLocalizedText(article.excerpt);
  const authorText = typeof article.author === 'string' ? article.author : getLocalizedText(article.author);
  const officeText = article.responsibleOffice
    ? typeof article.responsibleOffice === 'string'
      ? article.responsibleOffice
      : getLocalizedText(article.responsibleOffice)
    : undefined;

  // Find related articles
  const relatedArticles = article.relatedArticleIds
    ? mockNews.filter((item) => article.relatedArticleIds.includes(item.id))
    : mockNews.filter((item) => item.id !== article.id).slice(0, 2);

  // Category badge styling
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'training':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'tender':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'event':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'training':
        return t('news_tab_training');
      case 'tender':
        return t('news_tab_tender');
      case 'event':
        return t('news_tab_event');
      default:
        return t('news_tab_news');
    }
  };

  // Share handler
  const handleShare = async () => {
    const shareData = {
      title: titleText,
      text: excerptText,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Render a single content block safely
  const renderContentBlock = (block: NewsContentBlock, index: number) => {
    switch (block.type) {
      case 'paragraph': {
        const text = getLocalizedText(block.content);
        return (
          <p key={index} className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed mb-6">
            {text}
          </p>
        );
      }

      case 'heading': {
        const text = getLocalizedText(block.content);
        if (block.level === 2) {
          return (
            <h2 key={index} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-10 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
              {text}
            </h2>
          );
        }
        return (
          <h3 key={index} className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">
            {text}
          </h3>
        );
      }

      case 'image': {
        const altText = getLocalizedText(block.alt);
        const captionText = block.caption ? getLocalizedText(block.caption) : null;
        return (
          <figure key={index} className="my-8">
            <div className="overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 shadow-md">
              <img
                src={block.src}
                alt={altText}
                className="w-full h-auto max-h-[500px] object-cover"
                loading="lazy"
              />
            </div>
            {captionText && (
              <figcaption className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 italic">
                {captionText}
              </figcaption>
            )}
          </figure>
        );
      }

      case 'quote': {
        const text = getLocalizedText(block.content);
        const sourceText = block.source ? getLocalizedText(block.source) : null;
        return (
          <blockquote key={index} className="my-8 p-6 bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-600 rounded-r-xl relative">
            <Quote className="w-8 h-8 text-emerald-300 dark:text-emerald-800 absolute top-4 right-4 opacity-50" />
            <p className="text-lg italic font-medium text-gray-800 dark:text-gray-200 mb-3 relative z-10">
              {text}
            </p>
            {sourceText && (
              <footer className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                — {sourceText}
              </footer>
            )}
          </blockquote>
        );
      }

      case 'list': {
        const ListTag = block.ordered ? 'ol' : 'ul';
        return (
          <ListTag
            key={index}
            className={`my-6 space-y-3 ${
              block.ordered ? 'list-decimal list-inside text-gray-800 dark:text-gray-200' : 'space-y-3'
            }`}
          >
            {block.items.map((item, i) => {
              const itemText = getLocalizedText(item);
              if (block.ordered) {
                return (
                  <li key={i} className="text-gray-800 dark:text-gray-200 text-base sm:text-lg leading-relaxed pl-2">
                    {itemText}
                  </li>
                );
              }
              return (
                <li key={i} className="flex items-start gap-3 text-gray-800 dark:text-gray-200 text-base sm:text-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-2.5 flex-shrink-0" />
                  <span>{itemText}</span>
                </li>
              );
            })}
          </ListTag>
        );
      }

      case 'highlight': {
        const title = block.title ? getLocalizedText(block.title) : null;
        const text = getLocalizedText(block.content);
        return (
          <div key={index} className="my-8 p-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-lg mb-2">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              {title || t('highlight_notice')}
            </div>
            <p className="text-gray-800 dark:text-gray-200 text-base sm:text-lg leading-relaxed">
              {text}
            </p>
          </div>
        );
      }

      case 'relatedLink': {
        const title = getLocalizedText(block.title);
        return (
          <div key={index} className="my-8 p-4 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between gap-4">
            <span className="font-semibold text-gray-900 dark:text-white text-base">
              {title}
            </span>
            <Link
              to={block.url}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors flex-shrink-0"
            >
              <span>{t('view_all_news')}</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb Bar */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6 print:hidden">
          <Link
            to="/news"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('news_detail_breadcrumb')}
          </Link>
          <span>/</span>
          <span className="capitalize text-emerald-700 dark:text-emerald-400 font-semibold">
            {getCategoryLabel(article.category)}
          </span>
        </nav>

        {/* Article Header Card */}
        <header className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/80 dark:border-gray-700 mb-8">
          {/* Top Meta & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(article.category)}`}>
                {getCategoryLabel(article.category)}
              </span>
              {article.featured && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Featured
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={t('news_share_button')}
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('news_share_button')}</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={t('news_print_button')}
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('news_print_button')}</span>
              </button>
            </div>
          </div>

          {/* Copy Share Toast Notice */}
          {copied && (
            <div className="mb-4 p-3 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-medium flex items-center gap-2 print:hidden">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('news_share_copied')}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
            {titleText}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-6">
            {excerptText}
          </p>

          {/* Metadata Row */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700/80 flex flex-wrap items-center justify-between gap-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-gray-800 dark:text-gray-200">{authorText}</span>
              </div>
              {officeText && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{officeText}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{article.publishedAt || article.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{article.readingTime || article.readTime}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Banner Image */}
        <div className="mb-10 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 bg-gray-900">
          <img
            src={article.featuredImage || article.imageUrl}
            alt={typeof article.imageAlt === 'string' ? article.imageAlt : getLocalizedText(article.imageAlt)}
            className="w-full h-auto max-h-[520px] object-cover"
          />
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Article Body Column */}
          <main className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-10 shadow-sm border border-gray-200/80 dark:border-gray-700">
            {article.fullContent && article.fullContent.length > 0 ? (
              article.fullContent.map((block, idx) => renderContentBlock(block, idx))
            ) : (
              <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                {excerptText}
              </p>
            )}

            {/* Tags Section */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2 print:hidden">
                <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1" />
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-md border border-gray-200 dark:border-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Official Disclaimer Banner */}
            <div className="mt-10 p-5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <p className="font-bold text-gray-900 dark:text-white mb-1">
                  {t('demo_content_notice_title')}
                </p>
                <p>{t('demo_content_notice_desc')}</p>
              </div>
            </div>
          </main>

          {/* Right Sidebar Column */}
          <aside className="lg:col-span-4 space-y-6 print:hidden">
            {/* Bureau Press Contact Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200/80 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Press & Media Contact</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                For official media inquiries, press releases, or agricultural briefings, contact the Oromia Agricultural Bureau Press Directorate.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="block text-gray-500 dark:text-gray-400 font-medium">Location</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Finfinnee, Oromia, Ethiopia</span>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="block text-gray-500 dark:text-gray-400 font-medium">Official Hotline</span>
                  <span className="font-semibold text-gray-900 dark:text-white">+251 11 551 7000 / 8844</span>
                </div>
              </div>
            </div>

            {/* Related Articles Widget */}
            {relatedArticles.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200/80 dark:border-gray-700">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                  {t('news_related_title')}
                </h3>
                <div className="space-y-4">
                  {relatedArticles.map((relItem) => {
                    const relTitle = typeof relItem.title === 'string' ? relItem.title : getLocalizedText(relItem.title);
                    return (
                      <article
                        key={relItem.id}
                        className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700/50"
                      >
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(relItem.category)}`}>
                            {getCategoryLabel(relItem.category)}
                          </span>
                          <span>•</span>
                          <span>{relItem.publishedAt || relItem.date}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {relTitle}
                        </h4>
                        <Link
                          to={`/news/${relItem.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
                        >
                          <span>{t('view_all_news')}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;
