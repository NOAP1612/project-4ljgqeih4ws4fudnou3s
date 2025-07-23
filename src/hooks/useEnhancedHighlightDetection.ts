import { useCallback } from 'react';
import { useTextAnalysis } from './useTextAnalysis';

interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
}

interface EnhancedHighlight {
  start: number;
  end: number;
  energy: number;
  textScore: number;
  combinedScore: number;
  reason?: string;
  type?: string;
}

export const useEnhancedHighlightDetection = () => {
  const { analyzeTranscriptForStrongSegments, findStrongSegmentsFromText } = useTextAnalysis();

  const findEnhancedHighlights = useCallback(async (
    audioBuffer: Float32Array,
    sampleRate: number,
    transcription: TranscriptionResult | null,
    numSegments: number,
    threshold: number,
    excludeRange?: { start: number; end: number }
  ): Promise<EnhancedHighlight[]> => {
    // Step 1: Audio-based analysis (existing logic)
    const windowSize = sampleRate; // 1 second windows
    const energyValues: number[] = [];
    
    for (let i = 0; i < audioBuffer.length; i += windowSize) {
      const segment = audioBuffer.slice(i, i + windowSize);
      const energy = segment.reduce((sum, sample) => sum + Math.abs(sample), 0) / segment.length;
      energyValues.push(energy);
    }

    // Normalize energy values
    const maxEnergy = Math.max(...energyValues);
    const normalizedEnergy = energyValues.map(e => e / maxEnergy);

    // Find audio peaks
    const audioPeaks: Array<{ start: number; energy: number }> = [];
    
    for (let i = 0; i < normalizedEnergy.length; i++) {
      const currentTime = i; // i is seconds here because windowSize is 1 second
      
      // Check if inside excluded range
      if (excludeRange && currentTime >= excludeRange.start && currentTime <= excludeRange.end) {
        continue;
      }

      if (normalizedEnergy[i] > threshold) {
        // Ensure minimum distance between peaks
        if (audioPeaks.length === 0 || i - audioPeaks[audioPeaks.length - 1].start > 30) {
          audioPeaks.push({ start: i, energy: normalizedEnergy[i] });
        }
      }
    }

    // Step 2: Text-based analysis (if transcription available)
    let textPeaks: Array<{ start: number; end: number; reason: string; type: string; score: number }> = [];
    
    if (transcription && transcription.segments.length > 0) {
      try {
        const strongSentences = await analyzeTranscriptForStrongSegments(transcription.text);
        textPeaks = findStrongSegmentsFromText(transcription.segments, strongSentences);
      } catch (error) {
        console.warn('Text analysis failed, falling back to audio-only:', error);
      }
    }

    // Step 3: Combine and score peaks
    const combinedPeaks: EnhancedHighlight[] = [];

    // Process audio peaks
    audioPeaks.forEach(audioPeak => {
      const startTime = audioPeak.start;
      const endTime = Math.min(startTime + 30, audioBuffer.length / sampleRate); // Default 30-second clips
      
      // Check if this audio peak overlaps with any text peak
      const overlappingTextPeak = textPeaks.find(textPeak => 
        (startTime >= textPeak.start && startTime <= textPeak.end) ||
        (endTime >= textPeak.start && endTime <= textPeak.end) ||
        (startTime <= textPeak.start && endTime >= textPeak.end)
      );

      let combinedScore = audioPeak.energy;
      let textScore = 0;
      let reason = 'High audio energy';
      let type = 'Audio Peak';

      if (overlappingTextPeak) {
        textScore = overlappingTextPeak.score;
        combinedScore = audioPeak.energy * textScore; // Multiply for synergy
        reason = overlappingTextPeak.reason;
        type = overlappingTextPeak.type;
      }

      combinedPeaks.push({
        start: startTime,
        end: endTime,
        energy: audioPeak.energy,
        textScore,
        combinedScore,
        reason,
        type
      });
    });

    // Add text-only peaks that don't overlap with audio peaks
    textPeaks.forEach(textPeak => {
      const hasOverlappingAudio = combinedPeaks.some(peak =>
        (textPeak.start >= peak.start && textPeak.start <= peak.end) ||
        (textPeak.end >= peak.start && textPeak.end <= peak.end)
      );

      if (!hasOverlappingAudio) {
        // Find audio energy for this text segment
        const startIndex = Math.floor(textPeak.start);
        const endIndex = Math.floor(textPeak.end);
        const segmentEnergy = normalizedEnergy.slice(startIndex, endIndex + 1);
        const avgEnergy = segmentEnergy.length > 0 
          ? segmentEnergy.reduce((sum, e) => sum + e, 0) / segmentEnergy.length 
          : 0;

        combinedPeaks.push({
          start: textPeak.start,
          end: textPeak.end,
          energy: avgEnergy,
          textScore: textPeak.score,
          combinedScore: avgEnergy * textPeak.score,
          reason: textPeak.reason,
          type: textPeak.type
        });
      }
    });

    // Sort by combined score and return top segments
    const topPeaks = combinedPeaks
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, numSegments);

    // Convert back to simple number array for compatibility with existing code
    return topPeaks;
  }, [analyzeTranscriptForStrongSegments, findStrongSegmentsFromText]);

  return {
    findEnhancedHighlights
  };
};