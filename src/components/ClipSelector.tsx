import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { VideoPreview } from '@/components/VideoPreview';
import { Play, Clock, Star } from 'lucide-react';

interface ClipSelectorProps {
  file: File;
  highlights: number[];
  hookSegment: { start: number; end: number };
  selectedClips: number[];
  onSelectionChange: (selected: number[]) => void;
  aspectRatio: '16:9' | '9:16';
  clipDuration: number;
}

export const ClipSelector: React.FC<ClipSelectorProps> = ({
  file,
  highlights,
  hookSegment,
  selectedClips,
  onSelectionChange,
  aspectRatio,
  clipDuration
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClipToggle = (clipIndex: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedClips, clipIndex].sort((a, b) => a - b));
    } else {
      onSelectionChange(selectedClips.filter(i => i !== clipIndex));
    }
  };

  const allClips = [
    {
      index: 0,
      type: 'hook',
      title: 'הוק - פתיחה חזקה',
      startTime: hookSegment.start,
      endTime: hookSegment.end,
      duration: hookSegment.end - hookSegment.start
    },
    ...highlights.map((highlight, index) => ({
      index: index + 1,
      type: 'highlight',
      title: `קטע שיא ${index + 1}`,
      startTime: Math.max(0, highlight - clipDuration / 2),
      endTime: Math.min(highlight + clipDuration / 2, highlight + clipDuration),
      duration: clipDuration
    }))
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            בחירת קטעים - יחס {aspectRatio}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">סיכום הבחירה</span>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• קטעים נבחרים: {selectedClips.length}</p>
              <p>• אורך משוער: {Math.round(selectedClips.reduce((total, clipIndex) => {
                const clip = allClips.find(c => c.index === clipIndex);
                return total + (clip?.duration || 0);
              }, 0))} שניות</p>
              <p>• יחס גובה-רוחב: {aspectRatio}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allClips.map((clip) => (
              <Card key={clip.index} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  {videoUrl && (
                    <VideoPreview
                      videoUrl={videoUrl}
                      startTime={clip.startTime}
                      endTime={clip.endTime}
                      aspectRatio={aspectRatio}
                    />
                  )}
                  
                  <div className="absolute top-2 left-2">
                    <Badge 
                      variant={clip.type === 'hook' ? 'default' : 'secondary'}
                      className={clip.type === 'hook' ? 'bg-green-600' : 'bg-red-600'}
                    >
                      {clip.type === 'hook' ? 'הוק' : `שיא ${clip.index}`}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">{clip.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
                        <span>({Math.round(clip.duration)}s)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`clip-${clip.index}`}
                        checked={selectedClips.includes(clip.index)}
                        onCheckedChange={(checked) => 
                          handleClipToggle(clip.index, checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={`clip-${clip.index}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        כלול בסרטון הסופי
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedClips.length} מתוך {allClips.length} קטעים נבחרו
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange([])}
              >
                בטל הכל
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange(allClips.map(c => c.index))}
              >
                בחר הכל
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};