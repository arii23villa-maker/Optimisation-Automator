import React from 'react';
import { MediaPresence } from '../types';
import { Image, Video, Radio, Layers, Check, Minus } from 'lucide-react';

interface MediaChecklistWidgetProps {
  media?: MediaPresence;
  className?: string;
}

export const MediaChecklistWidget: React.FC<MediaChecklistWidgetProps> = ({
  media,
  className = ''
}) => {
  const currentMedia: MediaPresence = media || {
    hasImages: false,
    hasVideo: false,
    hasPodcast: false,
  };

  const items = [
    {
      id: 'images',
      label: 'Images',
      present: !!currentMedia.hasImages,
      icon: Image,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      description: '<img> tag with non-empty src'
    },
    {
      id: 'video',
      label: 'Video',
      present: !!currentMedia.hasVideo,
      icon: Video,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      description: '<video>, YouTube/Vimeo/Wistia iframe, or VideoObject schema'
    },
    {
      id: 'podcast',
      label: 'Podcast',
      present: !!currentMedia.hasPodcast,
      icon: Radio,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      description: '<audio>, podcast host link, or Podcast schema'
    }
  ];

  return (
    <div 
      id="media-presence-checklist-widget"
      className={`bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-50 uppercase tracking-wide">
              Media Checklist
            </h3>
            <p className="text-[11px] text-slate-400">
              Deterministic HTML Pattern Extraction (Agent 1)
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          Non-Scored
        </span>
      </div>

      {/* 3-Row Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
              <th className="py-2.5 px-3.5 font-bold uppercase tracking-wide text-[11px]">Media</th>
              <th className="py-2.5 px-3.5 font-bold uppercase tracking-wide text-[11px] text-center w-24">Present</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <tr key={item.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3.5 text-slate-200">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-md ${item.bgColor} ${item.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">{item.label}</span>
                        <p className="text-[11px] text-slate-500 hidden sm:block">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    {item.present ? (
                      <span 
                        id={`media-check-${item.id}-present`}
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-xs"
                      >
                        ✓
                      </span>
                    ) : (
                      <span 
                        id={`media-check-${item.id}-absent`}
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-500 border border-slate-700/50 font-semibold text-xs"
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Sits outside flag/scoring pipeline</span>
        <span className="font-mono">
          {[currentMedia.hasImages, currentMedia.hasVideo, currentMedia.hasPodcast].filter(Boolean).length}/3 Detected
        </span>
      </div>
    </div>
  );
};
