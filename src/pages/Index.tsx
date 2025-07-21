import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileUpload } from '@/components/FileUpload';
import { AudioAnalyzer } from '@/components/AudioAnalyzer';
import { VideoPreview } from '@/components/VideoPreview';
import { ClipSelector } from '@/components/ClipSelector';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { AspectRatioSelector } from '@/components/AspectRatioSelector';
import { useAudioProcessing } from '@/hooks/useAudioProcessing';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { Mic, Video, Sparkles, Download, Settings, Info, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ProcessedFile {
  file: File;
  audioData: Float32Array;
  duration: number;
  highlights: number[];
  hookSegment: { start: number; end: number };
}

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedFile | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedClips, setSelectedClips] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [numHighlights, setNumHighlights] = useState(3);
  const [clipDuration, setClipDuration] = useState(30);
  const [sensitivity, setSensitivity] = useState(0.7);

  const { processAudio } = useAudioProcessing();
  const { generateFinalVideo } = useVideoProcessing();

  const findBestHook = (audioBuffer: Float32Array, hookDuration: number, sampleRate: number): { start: number; end: number } => {
    const windowSamples = Math.floor(hookDuration * sampleRate);
    let maxEnergy = 0;
    let bestStartTime = 0;

    const stepSamples = Math.floor(sampleRate / 4); // Step by 0.25 second for more precision

    for (let i = 0; i <= audioBuffer.length - windowSamples; i += stepSamples) {
        const segment = audioBuffer.slice(i, i + windowSamples);
        const energy = segment.reduce((sum, sample) => sum + sample * sample, 0) / segment.length; // RMS energy

        if (energy > maxEnergy) {
            maxEnergy = energy;
            bestStartTime = i / sampleRate;
        }
    }
    
    const bestEndTime = Math.min(bestStartTime + hookDuration, audioBuffer.length / sampleRate);

    return { start: bestStartTime, end: bestEndTime };
  };

  const findHighlights = async (
    audioBuffer: Float32Array, 
    numSegments: number, 
    threshold: number,
    excludeRange?: { start: number; end: number }
  ): Promise<number[]> => {
    // Simple energy-based highlight detection
    const windowSize = 44100; // 1 second at 44.1kHz
    const energyValues: number[] = [];
    
    for (let i = 0; i < audioBuffer.length; i += windowSize) {
      const segment = audioBuffer.slice(i, i + windowSize);
      const energy = segment.reduce((sum, sample) => sum + Math.abs(sample), 0) / segment.length;
      energyValues.push(energy);
    }

    // Normalize energy values
    const maxEnergy = Math.max(...energyValues);
    const normalizedEnergy = energyValues.map(e => e / maxEnergy);

    // Find peaks
    const peaks: number[] = [];
    
    for (let i = 0; i < normalizedEnergy.length; i++) {
      const currentTime = i; // i is seconds here because windowSize is 1 second
      // Check if inside excluded range
      if (excludeRange && currentTime >= excludeRange.start && currentTime <= excludeRange.end) {
        continue;
      }

      if (normalizedEnergy[i] > threshold) {
        // Ensure minimum distance between peaks
        if (peaks.length === 0 || i - peaks[peaks.length - 1] > 30) {
          peaks.push(i);
        }
      }
    }

    // If not enough peaks, find top energy points
    if (peaks.length < numSegments) {
      const energySubset = normalizedEnergy
        .map((energy, index) => ({ energy, index }))
        .filter(({ index }) => {
            if (!excludeRange) return true;
            const currentTime = index;
            return currentTime < excludeRange.start || currentTime > excludeRange.end;
        });

      const topIndices = energySubset
        .sort((a, b) => b.energy - a.energy)
        .slice(0, numSegments)
        .map(item => item.index)
        .sort((a, b) => a - b);
      
      return topIndices;
    }

    return peaks.slice(0, numSegments).sort((a, b) => a - b);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    setProcessingStep('מעלה קובץ...');

    try {
      // Process audio for analysis
      setProcessingStep('מנתח אודיו...');
      const audioData = await processAudio(file);
      
      if (!audioData) {
        throw new Error('Failed to process audio');
      }

      // Find highlights and hook
      setProcessingStep('מחפש הוק וקטעי שיא...');
      const hookSegment = findBestHook(audioData.audioBuffer, 15, audioData.sampleRate);
      const highlights = await findHighlights(audioData.audioBuffer, numHighlights, sensitivity, hookSegment);

      const processed: ProcessedFile = {
        file,
        audioData: audioData.audioBuffer,
        duration: audioData.duration,
        highlights,
        hookSegment
      };

      setProcessedData(processed);
      setSelectedClips([0, ...highlights.slice(0, numHighlights).map((_, i) => i + 1)]);
      toast.success(`נמצאו ${highlights.length} קטעי שיא + הוק!`);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('שגיאה בעיבוד הקובץ');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [processAudio, numHighlights, sensitivity]);

  const handleGenerateFinalVideo = async () => {
    if (!processedData || selectedClips.length === 0) return;

    setIsProcessing(true);
    setProcessingStep('יוצר סרטון סופי...');

    try {
      const finalVideo = await generateFinalVideo(
        processedData.file,
        selectedClips,
        processedData.highlights,
        processedData.hookSegment,
        aspectRatio,
        clipDuration
      );

      if (finalVideo) {
        // Create download link
        const url = URL.createObjectURL(finalVideo);
        const a = document.createElement('a');
        a.href = url;
        a.download = `podcast-highlights-${aspectRatio.replace(':', 'x')}-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('הסרטון נוצר בהצלחה!');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error('שגיאה ביצירת הסרטון');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              עורך פודקאסטים חכם
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">יוצר סרטונים מרתקים עם פתיחה חזקה ורגעי שיא</p>
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              הוק אוטומטי
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Video className="h-3 w-3" />
              זיהוי שיאים
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Settings className="h-3 w-3" />
              יחסי גובה-רוחב
            </Badge>
          </div>
          
          {/* Quick Access to Transcription */}
          <div className="mb-6">
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/transcription">
                <FileText className="h-4 w-4" />
                תמלול אודיו/וידאו לטקסט
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  הגדרות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <AspectRatioSelector
                  value={aspectRatio}
                  onChange={setAspectRatio}
                />
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    מספר קטעי שיא
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="5"
                    value={numHighlights}
                    onChange={(e) => setNumHighlights(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">{numHighlights} קטעים</div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    אורך כל קטע (שניות)
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    value={clipDuration}
                    onChange={(e) => setClipDuration(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">{clipDuration} שניות</div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    רגישות זיהוי
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.9"
                    step="0.1"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">{sensitivity}</div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">💡 טיפים:</p>
                      <ul className="text-xs space-y-1">
                        <li>• ההוק הוא 15 השניות הכי חזקות</li>
                        <li>• 16:9 ליוטיוב, 9:16 לסטורי</li>
                        <li>• רגישות גבוהה = יותר קטעים</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="upload" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upload">העלאה</TabsTrigger>
                <TabsTrigger value="analysis" disabled={!processedData}>ניתוח</TabsTrigger>
                <TabsTrigger value="preview" disabled={!processedData}>תצוגה מקדימה</TabsTrigger>
                <TabsTrigger value="export" disabled={!processedData}>יצוא</TabsTrigger>
              </TabsList>

              {/* ... keep existing code (TabsContent sections) */}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
