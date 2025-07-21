import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Zap } from 'lucide-react';

interface AudioAnalyzerProps {
  audioData: Float32Array;
  duration: number;
  highlights: number[];
  hookSegment: { start: number; end: number };
}

export const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({
  audioData,
  duration,
  highlights,
  hookSegment
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [energyData, setEnergyData] = useState<number[]>([]);

  useEffect(() => {
    if (!audioData || audioData.length === 0) return;

    // Calculate energy values for visualization
    const windowSize = Math.floor(audioData.length / 1000); // ~1000 data points
    const energy: number[] = [];
    
    for (let i = 0; i < audioData.length; i += windowSize) {
      const segment = audioData.slice(i, i + windowSize);
      const rms = Math.sqrt(segment.reduce((sum, sample) => sum + sample * sample, 0) / segment.length);
      energy.push(rms);
    }
    
    setEnergyData(energy);
  }, [audioData]);

  useEffect(() => {
    if (!canvasRef.current || energyData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Normalize energy data
    const maxEnergy = Math.max(...energyData);
    const normalizedEnergy = energyData.map(e => e / maxEnergy);

    // Draw waveform
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();

    normalizedEnergy.forEach((energy, index) => {
      const x = (index / energyData.length) * width;
      const y = height - (energy * height * 0.8);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw hook segment
    const hookStartX = (hookSegment.start / duration) * width;
    const hookEndX = (hookSegment.end / duration) * width;
    
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.fillRect(hookStartX, 0, hookEndX - hookStartX, height);
    
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hookStartX, 0);
    ctx.lineTo(hookStartX, height);
    ctx.moveTo(hookEndX, 0);
    ctx.lineTo(hookEndX, height);
    ctx.stroke();

    // Draw highlight markers
    highlights.forEach(highlight => {
      const x = (highlight / duration) * width;
      
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(x - 2, 0, 4, height);
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    // Draw time axis
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 1);
    ctx.lineTo(width, height - 1);
    ctx.stroke();

    // Draw time labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    
    const timeMarkers = 5;
    for (let i = 0; i <= timeMarkers; i++) {
      const x = (i / timeMarkers) * width;
      const time = (i / timeMarkers) * duration;
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      
      ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, x, height - 5);
    }
  }, [energyData, duration, highlights, hookSegment]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ניתוח אנרגיית אודיו
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-48 w-full relative">
              <canvas
                ref={canvasRef}
                className="w-full h-full border rounded-lg bg-gray-50"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>הוק (התחלה)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>קטעי שיא</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>עוצמת אודיו</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">אורך כולל</p>
                <p className="text-lg font-semibold">{formatDuration(duration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">הוק</p>
                <p className="text-lg font-semibold">{formatDuration(hookSegment.end)} שניות</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">קטעי שיא</p>
                <p className="text-lg font-semibold">{highlights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פירוט קטעים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  הוק
                </Badge>
                <span className="font-medium">פתיחה חזקה</span>
              </div>
              <span className="text-sm text-gray-600">
                {formatDuration(hookSegment.start)} - {formatDuration(hookSegment.end)}
              </span>
            </div>

            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    שיא {index + 1}
                  </Badge>
                  <span className="font-medium">רגע מעניין</span>
                </div>
                <span className="text-sm text-gray-600">
                  דקה {formatDuration(highlight)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};