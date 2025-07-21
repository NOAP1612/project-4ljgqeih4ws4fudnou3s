export const calculateRMS = (audioData: Float32Array): number => {
  const sum = audioData.reduce((acc, sample) => acc + sample * sample, 0);
  return Math.sqrt(sum / audioData.length);
};

export const normalizeAudio = (audioData: Float32Array): Float32Array => {
  const max = Math.max(...audioData.map(Math.abs));
  if (max === 0) return audioData;
  
  return audioData.map(sample => sample / max);
};

export const getAudioSegment = (
  audioData: Float32Array,
  startTime: number,
  endTime: number,
  sampleRate: number
): Float32Array => {
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  
  return audioData.slice(startSample, endSample);
};

export const detectSilence = (
  audioData: Float32Array,
  threshold: number = 0.01,
  minDuration: number = 0.5,
  sampleRate: number = 44100
): Array<{ start: number; end: number }> => {
  const silentRegions: Array<{ start: number; end: number }> = [];
  const minSamples = Math.floor(minDuration * sampleRate);
  
  let silentStart = -1;
  let silentLength = 0;
  
  for (let i = 0; i < audioData.length; i++) {
    if (Math.abs(audioData[i]) < threshold) {
      if (silentStart === -1) {
        silentStart = i;
      }
      silentLength++;
    } else {
      if (silentStart !== -1 && silentLength >= minSamples) {
        silentRegions.push({
          start: silentStart / sampleRate,
          end: (silentStart + silentLength) / sampleRate
        });
      }
      silentStart = -1;
      silentLength = 0;
    }
  }
  
  // Check for silence at the end
  if (silentStart !== -1 && silentLength >= minSamples) {
    silentRegions.push({
      start: silentStart / sampleRate,
      end: (silentStart + silentLength) / sampleRate
    });
  }
  
  return silentRegions;
};

export const findOptimalCutPoints = (
  audioData: Float32Array,
  targetDuration: number,
  sampleRate: number = 44100
): number[] => {
  const silentRegions = detectSilence(audioData, 0.01, 0.2, sampleRate);
  const cutPoints: number[] = [];
  
  // Find cut points near silent regions
  const targetInterval = targetDuration;
  let currentTime = 0;
  
  while (currentTime < audioData.length / sampleRate) {
    const targetTime = currentTime + targetInterval;
    
    // Find the nearest silent region
    const nearestSilence = silentRegions.find(region => 
      Math.abs(region.start - targetTime) < 2 || Math.abs(region.end - targetTime) < 2
    );
    
    if (nearestSilence) {
      cutPoints.push(nearestSilence.start);
      currentTime = nearestSilence.end;
    } else {
      cutPoints.push(targetTime);
      currentTime = targetTime;
    }
  }
  
  return cutPoints;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const parseTime = (timeString: string): number => {
  const [mins, secs] = timeString.split(':').map(Number);
  return mins * 60 + secs;
};