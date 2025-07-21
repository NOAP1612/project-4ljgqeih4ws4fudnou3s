import React from 'react';
import { cn } from '@/lib/utils';

interface Clip {
  startTime: number;
  endTime: number;
  type: 'hook' | 'highlight';
}

interface VideoTimelineProps {
  duration: number;
  clips: Clip[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  duration,
  clips,
  currentTime,
  onSeek,
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = (clickX / rect.width) * duration;
    onSeek(seekTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-2">
        <div
            className="h-4 bg-gray-200 rounded-full relative cursor-pointer group"
            onClick={handleTimelineClick}
        >
            {/* Clips markers */}
            {clips.map((clip, index) => {
            const left = duration > 0 ? (clip.startTime / duration) * 100 : 0;
            const width = duration > 0 ? ((clip.endTime - clip.startTime) / duration) * 100 : 0;
            return (
                <div
                key={index}
                className={cn(
                    "absolute h-full rounded-full opacity-70 hover:opacity-100 transition-opacity",
                    clip.type === 'hook' ? 'bg-green-500' : 'bg-red-500'
                )}
                style={{ left: `${left}%`, width: `${width}%` }}
                />
            );
            })}

            {/* Progress bar */}
            <div
            className="absolute h-full bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}
            >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-600 group-hover:scale-110 transition-transform" />
            </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
        </div>
    </div>
  );
};