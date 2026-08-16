import React from 'react';
import { AchievementContentBlock, LocalizedText, createEmptyLocalizedText } from '../../../types/achievement';
import { LocalizedTextFields } from '../news/LocalizedTextFields';
import { FileText, Plus, Trash2, MoveUp, MoveDown, Type, Heading, Quote, List, ListOrdered } from 'lucide-react';

interface AchievementContentBlockEditorProps {
  blocks: AchievementContentBlock[];
  onChange: (blocks: AchievementContentBlock[]) => void;
}

export const AchievementContentBlockEditor: React.FC<AchievementContentBlockEditorProps> = ({
  blocks,
  onChange,
}) => {
  const handleAddBlock = (type: AchievementContentBlock['type']) => {
    const newBlock: AchievementContentBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      content: createEmptyLocalizedText(),
      level: type === 'heading' ? 2 : undefined,
    };
    onChange([...blocks, newBlock]);
  };

  const handleRemoveBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  const handleUpdateContent = (index: number, content: LocalizedText) => {
    const updated = blocks.map((b, i) => (i === index ? { ...b, content } : b));
    onChange(updated);
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Structured Story Content Blocks ({blocks.length})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Build the detailed narrative using localized paragraphs, subheadings, quotes, and bullet lists.
          </p>
        </div>

        {/* Add Block Types Dropdown / Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleAddBlock('paragraph')}
            className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1 transition-colors"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Paragraph</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('heading')}
            className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1 transition-colors"
          >
            <Heading className="w-3.5 h-3.5" />
            <span>Heading</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('quote')}
            className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1 transition-colors"
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Quote</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('bullet-list')}
            className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            <span>Bullet List</span>
          </button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            No story content blocks added. Choose a block type above to begin writing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Block #{index + 1}: {block.type}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveBlock(index, 'up')}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === blocks.length - 1}
                    onClick={() => handleMoveBlock(index, 'down')}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlock(index)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <LocalizedTextFields
                label={`${block.type.toUpperCase()} Content`}
                value={block.content || createEmptyLocalizedText()}
                onChange={(content) => handleUpdateContent(index, content)}
                multiline={block.type !== 'heading'}
                rows={block.type === 'paragraph' ? 3 : 2}
                requiredOm={true}
                placeholderOm="Qabiyyee seenaa barreessi..."
                placeholderAm="የይዘት መረጃ..."
                placeholderEn="Block text in English..."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
