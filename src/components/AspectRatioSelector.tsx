import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AspectRatioSelectorProps {
  value: '16:9' | '9:16';
  onChange: (ratio: '16:9' | '9:16') => void;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  value,
  onChange
}) => {
  const ratios = [
    {
      value: '16:9' as const,
      label: '16:9 רגיל',
      description: 'יוטיוב, מסכי מחשב',
      icon: Monitor,
      preview: 'w-12 h-7'
    },
    {
      value: '9:16' as const,
      label: '9:16 סטורי',
      description: 'TikTok, Instagram',
      icon: Smartphone,
      preview: 'w-7 h-12'
    }
  ];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium block">יחס גובה-רוחב</label>
      
      <div className="grid grid-cols-1 gap-3">
        {ratios.map((ratio) => {
          const Icon = ratio.icon;
          const isSelected = value === ratio.value;
          
          return (
            <Card
              key={ratio.value}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected 
                  ? "ring-2 ring-blue-500 bg-blue-50" 
                  : "hover:bg-gray-50"
              )}
              onClick={() => onChange(ratio.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isSelected ? "bg-blue-100" : "bg-gray-100"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      isSelected ? "text-blue-600" : "text-gray-600"
                    )} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{ratio.label}</span>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          נבחר
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{ratio.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className={cn(
                      "border-2 rounded transition-colors",
                      ratio.preview,
                      isSelected 
                        ? "border-blue-500 bg-blue-100" 
                        : "border-gray-300 bg-gray-100"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>• <strong>16:9</strong> - מושלם ליוטיוב ומסכי מחשב</p>
        <p>• <strong>9:16</strong> - אידיאלי לסטורי ו-TikTok</p>
      </div>
    </div>
  );
};