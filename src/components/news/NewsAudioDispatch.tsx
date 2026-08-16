import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { radioDispatches, RadioDispatchEpisode } from '../../data/newsEventsData';
import { useToast } from '../../context/ToastContext';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Headphones,
  Calendar,
  User,
  Share2,
  CheckCircle2,
} from 'lucide-react';

export const NewsAudioDispatch: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const { showToast } = useToast();

  const [activeEpisode, setActiveEpisode] = useState<RadioDispatchEpisode>(radioDispatches[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Simulated audio playback progress timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= activeEpisode.audioDurationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, activeEpisode]);

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        showToast(
          `Playing ${getLocalizedText(activeEpisode.title)} (Episode ${activeEpisode.episodeNumber})`,
          'info'
        );
      }
      return next;
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleShareAudio = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Radio dispatch episode link copied to clipboard!', 'success');
    }
  };

  const currentTitle = getLocalizedText(activeEpisode.title);
  const currentSummary = getLocalizedText(activeEpisode.summary);
  const host = getLocalizedText(activeEpisode.host);
  const guest = getLocalizedText(activeEpisode.guest);
  const topic = getLocalizedText(activeEpisode.topicCategory);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-[#053B23] to-[#0A482A] text-white p-6 sm:p-8 lg:p-10 border border-emerald-700/50 shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-700/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#A3E635] text-gray-900 flex items-center justify-center shadow-md">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#D5A62E] text-gray-900 uppercase tracking-wider">
                Weekly Field Radio
              </span>
              <span className="text-xs text-emerald-300 font-semibold">
                Episode #{activeEpisode.episodeNumber}
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-0.5">
              Oromia Agricultural Bureau Radio Dispatch
            </h3>
          </div>
        </div>

        {/* Episode Selector Chips */}
        <div className="flex items-center gap-2">
          {radioDispatches.map((ep) => (
            <button
              key={ep.id}
              type="button"
              onClick={() => {
                setActiveEpisode(ep);
                setCurrentTime(0);
                setIsPlaying(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeEpisode.id === ep.id
                  ? 'bg-[#A3E635] text-gray-900 font-black shadow-md'
                  : 'bg-black/30 hover:bg-white/10 text-emerald-200 border border-emerald-600/40'
              }`}
            >
              Ep. {ep.episodeNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Main Player Visual Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Episode Description */}
        <div className="lg:col-span-7 space-y-3">
          <span className="text-xs font-bold text-[#A3E635] tracking-wide uppercase">
            {topic}
          </span>
          <h4 className="text-xl sm:text-2xl font-black text-white leading-snug">
            {currentTitle}
          </h4>
          <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
            {currentSummary}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-emerald-200/90 font-medium">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#A3E635]" />
              <span>Host: {host}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-amber-300" />
              <span>Guest: {guest}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>Broadcast: {activeEpisode.broadcastDate}</span>
            </span>
          </div>
        </div>

        {/* Audio Controls Console */}
        <div className="lg:col-span-5 bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-emerald-600/40 space-y-4 shadow-inner">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 font-bold">
              <span>{formatSeconds(currentTime)}</span>
              <span>{activeEpisode.duration}</span>
            </div>
            <input
              type="range"
              min="0"
              max={activeEpisode.audioDurationSeconds}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-[#A3E635]"
            />
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentTime(0)}
              title="Restart"
              className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Play/Pause Main Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-12 h-12 rounded-2xl bg-[#A3E635] hover:bg-[#b5f347] text-gray-900 flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-gray-900" />
              ) : (
                <Play className="w-6 h-6 fill-gray-900 ml-0.5" />
              )}
            </button>

            {/* Speed Toggle */}
            <button
              type="button"
              onClick={() =>
                setPlaybackSpeed((prev) => (prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1))
              }
              className="px-2.5 py-1 text-xs font-bold text-emerald-200 bg-white/10 hover:bg-white/20 rounded-lg border border-emerald-500/30 transition-colors"
            >
              {playbackSpeed}x
            </button>

            {/* Mute Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShareAudio}
              className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
