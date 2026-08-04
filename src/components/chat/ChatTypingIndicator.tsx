import React from 'react';
import { Bot } from 'lucide-react';

export const ChatTypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-2.5 my-2">
      <div className="h-7 w-7 rounded-lg bg-[#063D2A] dark:bg-emerald-900 border border-emerald-700/50 flex items-center justify-center text-[#D7A928] shrink-0 mt-0.5">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-tl-none bg-white dark:bg-[#142C21] border border-gray-200 dark:border-emerald-900/60 p-3 shadow-xs">
        <div className="flex items-center gap-1.5 h-4">
          <span className="h-2 w-2 rounded-full bg-[#087A4B] dark:bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-[#087A4B] dark:bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-[#087A4B] dark:bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
