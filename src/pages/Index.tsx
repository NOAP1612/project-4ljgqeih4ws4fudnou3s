import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// ... keep existing code
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { Mic, Video, Sparkles, Download, Settings, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ProcessedFile {
// ... keep existing code
}

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
// ... keep existing code
  const [sensitivity, setSensitivity] = useState(0.7);

  const { processAudio } = useAudioProcessing();
  const { generateFinalVideo } = useVideoProcessing();

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

  const findBestHook = (audioBuffer: Float32Array, hookDuration: number, sampleRate: number): { start: number; end: number } => {
    const windowSamples = Math.floor(hookDuration * sampleRate);
    let maxEnergy = 0;
    let bestStartTime = 0;

    const stepSamples = sampleRate; // Step by 1 second

    for (let i = 0; i <= audioBuffer.length - windowSamples; i += stepSamples) {
        const segment = audioBuffer.slice(i, i + windowSamples);
        const energy = segment.reduce((sum, sample) => sum + Math.abs(sample), 0) / segment.length;

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
      // Check if inside excluded range
      if (excludeRange && i >= excludeRange.start && i <= excludeRange.end) {
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
            return index < excludeRange.start || index > excludeRange.end;
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

  const handleGenerateFinalVideo = async () => {
// ... keep existing code
// ... keep existing code
// ... keep existing code
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
// ... keep existing code
// ... keep existing code
// ... keep existing code
};

export default Index;
