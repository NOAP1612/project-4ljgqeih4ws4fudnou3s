import React, { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes: string[];
  maxSize: number;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedTypes,
  maxSize,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'סוג קובץ לא נתמך. אנא בחר קובץ וידאו או אודיו.';
    }
    
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `הקובץ גדול מדי. גודל מקסימלי: ${maxSizeMB}MB`;
    }
    
    return null;
  }, [acceptedTypes, maxSize]);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const formatFileTypes = () => {
    const extensions = acceptedTypes.map(type => {
      switch (type) {
        case 'video/mp4': return 'MP4';
        case 'video/avi': return 'AVI';
        case 'video/mov': return 'MOV';
        case 'audio/mp3': return 'MP3';
        case 'audio/wav': return 'WAV';
        default: return type.split('/')[1]?.toUpperCase() || '';
      }
    }).filter(Boolean);
    
    return extensions.join(', ');
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer",
          isDragOver 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400",
          error && "border-red-300 bg-red-50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className={cn(
              "p-4 rounded-full transition-colors",
              isDragOver ? "bg-blue-100" : "bg-gray-100"
            )}>
              <Upload className={cn(
                "h-8 w-8",
                isDragOver ? "text-blue-600" : "text-gray-600"
              )} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                גרור קובץ לכאן או לחץ לבחירה
              </h3>
              <p className="text-sm text-gray-500">
                פורמטים נתמכים: {formatFileTypes()}
              </p>
              <p className="text-xs text-gray-400">
                גודל מקסימלי: {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>
            
            <input
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="mt-4"
            >
              <File className="h-4 w-4 mr-2" />
              בחר קובץ
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};