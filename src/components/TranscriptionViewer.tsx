import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface TranscriptionViewerProps {
  segments: TranscriptionSegment[];
  currentTime: number;
  onSegmentClick: (time: number) => void;
  className?: string;
}

export const TranscriptionViewer: React.FC<TranscriptionViewerProps> = ({
  segments,
  currentTime,
  onSegmentClick,
  className,
}) => {
  const activeSegmentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          תמלול חי
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4 text-right">
            {segments.map((segment, index) => {
              const isActive = currentTime >= segment.start && currentTime < segment.end;
              return (
                <p
                  key={index}
                  ref={isActive ? activeSegmentRef : null}
                  onClick={() => onSegmentClick(segment.start)}
                  className={cn(
                    "cursor-pointer rounded-md p-2 transition-colors duration-200 leading-relaxed",
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "hover:bg-gray-100"
                  )}
                >
                  <span className="font-mono text-xs text-gray-500 block mb-1">
                    [{formatTime(segment.start)}]
                  </span>
                  {segment.text}
                </p>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};