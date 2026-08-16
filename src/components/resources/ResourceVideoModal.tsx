import React, { useState } from 'react';
import { Publication } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Play,
  Pause,
  Download,
  Volume2,
  Maximize2,
  Clock,
  Sparkles,
  CheckCircle2,
  Share2,
  FileText,
} from 'lucide-react';

interface ResourceVideoModalProps {
  publication: Publication | null;
  onClose: () => void;
}

export const ResourceVideoModal: React.FC<ResourceVideoModalProps> = ({
  publication,
  onClose,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTimestamp, setActiveTimestamp] = useState('00:00');

  if (!publication) return null;

  const title = t(publication.titleKey) || publication.defaultTitle || 'Video Masterclass';
  const description = t(publication.descriptionKey) || publication.defaultDescription;

  const handleDownloadVideo = () => {
    showToast(
      'Downloading HD video for offline extension playback...',
      'success',
      title
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0B150F] border border-emerald-900/60 shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col text-white">
        {/* Video Player Display Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
          {publication.coverImage && (
            <img
              src={publication.coverImage}
              alt={title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isPlaying ? 'opacity-80' : 'opacity-40'
              }`}
            />
          )}

          {/* Video Player Overlay Simulation */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-between p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A3E635] text-[#053B23] text-xs font-black">
                <Sparkles className="h-3 w-3" />
                <span>OAB Official Masterclass HD</span>
              </span>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Center Play Button */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-5 rounded-full bg-[#075B36]/90 hover:bg-[#A3E635] text-white hover:text-[#053B23] shadow-2xl transition-all scale-100 hover:scale-110"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </button>
            </div>

            {/* Bottom Playback Control Bar */}
            <div className="space-y-2">
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                <div className="h-full bg-[#A3E635] w-2/5 rounded-full" />
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-emerald-200">
                <div className="flex items-center gap-3">
                  <span>{activeTimestamp}</span>
                  <span>/</span>
                  <span>{publication.videoDuration || '15:00'}</span>
                  <span className="text-white/40">•</span>
                  <span>Language: {publication.language}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-emerald-200 cursor-pointer" />
                  <Maximize2 className="h-4 w-4 text-emerald-200 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Information & Timestamp Guide */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-72">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white">{title}</h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-2xl">
                {description}
              </p>
            </div>

            <button
              onClick={handleDownloadVideo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#075B36] hover:bg-[#A3E635] text-white hover:text-[#053B23] text-xs font-black shrink-0 transition-all shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Download MP4 ({publication.fileSize})</span>
            </button>
          </div>

          {/* Timestamps / Chapters */}
          {publication.tableOfContents && publication.tableOfContents.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#A3E635] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Jump to Key Chapter Timestamps</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {publication.tableOfContents.map((chapter, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const match = chapter.match(/^\d{2}:\d{2}/);
                      if (match) setActiveTimestamp(match[0]);
                      showToast(`Skipped to ${chapter.slice(0, 20)}...`, 'info', title);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-left text-emerald-100 border border-white/5 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#A3E635] shrink-0" />
                    <span className="truncate">{chapter}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
