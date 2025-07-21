import { useCallback } from 'react';

interface AudioData {
  audioBuffer: Float32Array;
  duration: number;
  sampleRate: number;
}

export const useAudioProcessing = () => {
  const processAudio = useCallback(async (file: File): Promise<AudioData | null> => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get audio data from first channel
      const audioData = audioBuffer.getChannelData(0);
      
      return {
        audioBuffer: audioData,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate
      };
    } catch (error) {
      console.error('Audio processing error:', error);
      return null;
    }
  }, []);

  const analyzeAudioEnergy = useCallback((audioData: Float32Array, windowSize: number = 44100): number[] => {
    const energyValues: number[] = [];
    
    for (let i = 0; i < audioData.length; i += windowSize) {
      const segment = audioData.slice(i, i + windowSize);
      const rms = Math.sqrt(segment.reduce((sum, sample) => sum + sample * sample, 0) / segment.length);
      energyValues.push(rms);
    }
    
    return energyValues;
  }, []);

  const findPeaks = useCallback((energyValues: number[], threshold: number = 0.7, minDistance: number = 30): number[] => {
    // Normalize energy values
    const maxEnergy = Math.max(...energyValues);
    const normalizedEnergy = energyValues.map(e => e / maxEnergy);
    
    const peaks: number[] = [];
    
    // Skip first 15 seconds (hook area)
    const skipSeconds = 15;
    
    for (let i = skipSeconds; i < normalizedEnergy.length; i++) {
      if (normalizedEnergy[i] > threshold) {
        // Check minimum distance from previous peak
        if (peaks.length === 0 || i - peaks[peaks.length - 1] > minDistance) {
          peaks.push(i);
        }
      }
    }
    
    return peaks;
  }, []);

  return {
    processAudio,
    analyzeAudioEnergy,
    findPeaks
  };
};