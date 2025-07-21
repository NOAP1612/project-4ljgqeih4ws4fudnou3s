export const getVideoMetadata = (file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight
      };
      
      URL.revokeObjectURL(video.src);
      resolve(metadata);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const calculateCropDimensions = (
  originalWidth: number,
  originalHeight: number,
  targetAspectRatio: '16:9' | '9:16'
): { width: number; height: number; x: number; y: number } => {
  const targetRatio = targetAspectRatio === '16:9' ? 16/9 : 9/16;
  const originalRatio = originalWidth / originalHeight;
  
  let cropWidth: number;
  let cropHeight: number;
  
  if (originalRatio > targetRatio) {
    // Original is wider than target
    cropHeight = originalHeight;
    cropWidth = cropHeight * targetRatio;
  } else {
    // Original is taller than target
    cropWidth = originalWidth;
    cropHeight = cropWidth / targetRatio;
  }
  
  const x = (originalWidth - cropWidth) / 2;
  const y = (originalHeight - cropHeight) / 2;
  
  return {
    width: cropWidth,
    height: cropHeight,
    x,
    y
  };
};

export const generateThumbnail = (
  videoFile: File,
  timeInSeconds: number = 0
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = Math.min(timeInSeconds, video.duration);
    };
    
    video.onseeked = () => {
      ctx.drawImage(video, 0, 0);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      URL.revokeObjectURL(video.src);
      resolve(thumbnailUrl);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const isAudioFile = (file: File): boolean => {
  return file.type.startsWith('audio/');
};

export const getSupportedFormats = () => {
  return {
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
  };
};

export const validateFileFormat = (file: File): boolean => {
  const supportedFormats = getSupportedFormats();
  return [
    ...supportedFormats.video,
    ...supportedFormats.audio
  ].includes(file.type);
};

export const estimateProcessingTime = (fileSizeInMB: number): number => {
  // Rough estimation: 1MB = 2 seconds processing time
  return Math.max(5, fileSizeInMB * 2);
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};