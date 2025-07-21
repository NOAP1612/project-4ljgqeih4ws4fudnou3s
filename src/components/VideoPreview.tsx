import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  videoUrl: string;
  startTime: number;
  endTime: number;
  aspectRatio: '16:9' | '9:16';
  className?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  startTime,
  endTime,
  aspectRatio,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(startTime);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      
      // Loop the clip
      if (time >= endTime) {
        video.currentTime = startTime;
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Set initial time
    video.currentTime = startTime;

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [startTime, endTime]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.currentTime = startTime;
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const progress = ((currentTime - startTime) / (endTime - startTime)) * 100;

  return (
    <div className={cn("relative group", className)}>
      <video
        ref={videoRef}
        src={videoUrl}
        className={cn(
          "w-full h-full object-cover rounded-lg",
          aspectRatio === '9:16' ? "object-center" : "object-center"
        )}
        muted={isMuted}
        playsInline
        preload="metadata"
      />
      
      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="absolute bottom-2 left-2 right-2">
          {/* Progress Bar */}
          <div className="bg-white/20 rounded-full h-1 mb-2">
            <div 
              className="bg-white rounded-full h-1 transition-all duration-100"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="text-white text-xs font-medium">
              {Math.round(endTime - startTime)}s
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Aspect Ratio Indicator */}
      <div className="absolute top-2 right-2">
        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
          {aspectRatio}
        </div>
      </div>
    </div>
  );
};