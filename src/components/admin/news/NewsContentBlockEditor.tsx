import React, { useState } from 'react';
import { NewsContentBlock, LocalizedText, createEmptyLocalizedText } from '../../../types/news';
import { LocalizedTextFields } from './LocalizedTextFields';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  Heading,
  Quote,
  List,
  Sparkles,
  GripVertical,
} from 'lucide-react';

interface NewsContentBlockEditorProps {
  blocks: NewsContentBlock[];
  onChange: (updatedBlocks: NewsContentBlock[]) => void;
}

export const NewsContentBlockEditor: React.FC<NewsContentBlockEditorProps> = ({
  blocks,
  onChange,
}) => {
  const generateBlockId = () => `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const addBlock = (type: NewsContentBlock['type']) => {
    let newBlock: NewsContentBlock;
    const id = generateBlockId();

    switch (type) {
      case 'heading':
        newBlock = { id, type: 'heading', level: 2, content: createEmptyLocalizedText() };
        break;
      case 'quote':
        newBlock = { id, type: 'quote', content: createEmptyLocalizedText() };
        break;
      case 'list':
        newBlock = {
          id,
          type: 'list',
          ordered: false,
          items: [createEmptyLocalizedText()],
        };
        break;
      case 'highlight':
        newBlock = { id, type: 'highlight', content: createEmptyLocalizedText() };
        break;
      case 'paragraph':
      default:
        newBlock = { id, type: 'paragraph', content: createEmptyLocalizedText() };
        break;
    }

    onChange([...blocks, newBlock]);
  };

  const removeBlock = (index: number) => {
    const updated = blocks.filter((_, i) => i !== index);
    onChange(updated);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    onChange(updated);
  };

  const updateBlockContent = (index: number, content: LocalizedText) => {
    const updated = [...blocks];
    const block = updated[index];
    if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote' || block.type === 'highlight') {
      updated[index] = { ...block, content } as any;
      onChange(updated);
    }
  };

  const updateQuoteSource = (index: number, source: LocalizedText) => {
    const updated = [...blocks];
    const block = updated[index];
    if (block.type === 'quote') {
      updated[index] = { ...block, source };
      onChange(updated);
    }
  };

  const updateHeadingLevel = (index: number, level: 2 | 3) => {
    const updated = [...blocks];
    const block = updated[index];
    if (block.type === 'heading') {
      updated[index] = { ...block, level };
      onChange(updated);
    }
  };

  const updateListOrdered = (index: number, ordered: boolean) => {
    const updated = [...blocks];
    const block = updated[index];
    if (block.type === 'list') {
      updated[index] = { ...block, ordered };
      onChange(updated);
    }
  };

  const updateListItem = (blockIndex: number, itemIndex: number, text: LocalizedText) => {
    const updated = [...blocks];
    const block = updated[blockIndex];
    if (block.type === 'list') {
      const items = [...block.items];
      items[itemIndex] = text;
      updated[blockIndex] = { ...block, items };
      onChange(updated);
    }
  };

  const addListItem = (blockIndex: number) => {
    const updated = [...blocks];
    const block = updated[blockIndex];
    if (block.type === 'list') {
      updated[blockIndex] = {
        ...block,
        items: [...block.items, createEmptyLocalizedText()],
      };
      onChange(updated);
    }
  };

  const removeListItem = (blockIndex: number, itemIndex: number) => {
    const updated = [...blocks];
    const block = updated[blockIndex];
    if (block.type === 'list') {
      const items = block.items.filter((_, i) => i !== itemIndex);
      updated[blockIndex] = { ...block, items };
      onChange(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Structured Content Blocks</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Build your article body with responsive, multilingual content blocks.
          </p>
        </div>

        {/* Add Block Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => addBlock('paragraph')}
            className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
          >
            <Plus className="w-3 h-3 text-emerald-600" /> Paragraph
          </button>
          <button
            type="button"
            onClick={() => addBlock('heading')}
            className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
          >
            <Heading className="w-3 h-3 text-blue-600" /> Heading
          </button>
          <button
            type="button"
            onClick={() => addBlock('quote')}
            className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
          >
            <Quote className="w-3 h-3 text-purple-600" /> Quote
          </button>
          <button
            type="button"
            onClick={() => addBlock('list')}
            className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
          >
            <List className="w-3 h-3 text-amber-600" /> List
          </button>
          <button
            type="button"
            onClick={() => addBlock('highlight')}
            className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
          >
            <Sparkles className="w-3 h-3 text-emerald-500" /> Highlight
          </button>
        </div>
      </div>

      {/* Render Blocks */}
      {blocks.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <AlignLeft className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            No content blocks added yet. Click one of the buttons above to start writing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Block Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Block #{idx + 1}:
                  </span>
                  <span className="text-xs font-black capitalize text-emerald-700 dark:text-emerald-400">
                    {block.type}
                  </span>
                </div>

                {/* Actions: Move Up, Move Down, Delete */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Up"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(idx, 'down')}
                    disabled={idx === blocks.length - 1}
                    title="Move Down"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(idx)}
                    title="Remove Block"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Block Type Specific Editors */}
              {block.type === 'heading' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Heading Level:
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateHeadingLevel(idx, 2)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                          block.level === 2
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        H2 (Major Section)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateHeadingLevel(idx, 3)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                          block.level === 3
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        H3 (Sub-Section)
                      </button>
                    </div>
                  </div>
                  <LocalizedTextFields
                    label="Heading Text"
                    value={block.content}
                    onChange={(val) => updateBlockContent(idx, val)}
                    requiredOm
                    placeholderOm="Mataduree seensa..."
                    placeholderAm="ርዕስ..."
                    placeholderEn="Heading title..."
                  />
                </div>
              )}

              {block.type === 'paragraph' && (
                <LocalizedTextFields
                  label="Paragraph Content"
                  value={block.content}
                  onChange={(val) => updateBlockContent(idx, val)}
                  multiline
                  rows={4}
                  requiredOm
                  placeholderOm="Keeyyata oduu asitti barreessi..."
                  placeholderAm="የዜና አንቀጽ እዚህ ይጻፉ..."
                  placeholderEn="Write paragraph body here..."
                />
              )}

              {block.type === 'quote' && (
                <div className="space-y-4">
                  <LocalizedTextFields
                    label="Quote Content"
                    value={block.content}
                    onChange={(val) => updateBlockContent(idx, val)}
                    multiline
                    rows={3}
                    requiredOm
                    placeholderOm="Maddaa fi yaada jedhame..."
                    placeholderAm="የተጠቀሰ አባባል..."
                    placeholderEn="Quotation text..."
                  />
                  <LocalizedTextFields
                    label="Quote Source / Speaker (Optional)"
                    value={block.source || createEmptyLocalizedText()}
                    onChange={(val) => updateQuoteSource(idx, val)}
                    placeholderOm="Dr. Ballinaa Tashoomee (Hogganaa Biiroo)..."
                    placeholderAm="ዶ/ር በሊና ተሾመ..."
                    placeholderEn="Dr. Ballina Tashoome..."
                  />
                </div>
              )}

              {block.type === 'highlight' && (
                <LocalizedTextFields
                  label="Key Highlight Callout Box"
                  value={block.content}
                  onChange={(val) => updateBlockContent(idx, val)}
                  multiline
                  rows={3}
                  requiredOm
                  placeholderOm="Yaada ijoo fi odeeffannoo murteessaa..."
                  placeholderAm="ዋና ዋና ነጥቦች..."
                  placeholderEn="Key takeaways or callout summary..."
                />
              )}

              {block.type === 'list' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      List Style:
                    </label>
                    <button
                      type="button"
                      onClick={() => updateListOrdered(idx, !block.ordered)}
                      className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                    >
                      {block.ordered ? 'Numbered List (1, 2, 3)' : 'Bullet List (•)'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {block.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-start gap-2">
                        <span className="text-xs font-bold text-slate-400 mt-3 w-5 text-right">
                          {block.ordered ? `${itemIdx + 1}.` : '•'}
                        </span>
                        <div className="flex-1">
                          <LocalizedTextFields
                            label={`List Item #${itemIdx + 1}`}
                            value={item}
                            onChange={(val) => updateListItem(idx, itemIdx, val)}
                            placeholderOm="Tarkaanfii fi qabxii..."
                            placeholderAm="የዝርዝር ነጥብ..."
                            placeholderEn="List item..."
                          />
                        </div>
                        {block.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeListItem(idx, itemIdx)}
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg mt-3"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addListItem(idx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add List Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
