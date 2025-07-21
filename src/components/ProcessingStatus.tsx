import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  isProcessing: boolean;
  currentStep: string;
  progress?: number;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  isProcessing,
  currentStep,
  progress
}) => {
  if (!isProcessing) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-blue-900">מעבד...</h4>
              {progress !== undefined && (
                <span className="text-sm text-blue-700">{Math.round(progress)}%</span>
              )}
            </div>
            
            <p className="text-sm text-blue-700">{currentStep}</p>
            
            {progress !== undefined ? (
              <Progress value={progress} className="h-2" />
            ) : (
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-xs text-blue-600 space-y-1">
          <p>• אנא המתן בזמן העיבוד</p>
          <p>• זמן העיבוד תלוי באורך הקובץ</p>
          <p>• אל תסגור את הדפדפן</p>
        </div>
      </CardContent>
    </Card>
  );
};