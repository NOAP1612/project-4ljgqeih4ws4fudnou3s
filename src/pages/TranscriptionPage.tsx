import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/FileUpload';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Mic, Upload, ArrowLeft } from 'lucide-react';
import { transcribeAudio } from '@/functions';
import { uploadFile } from '@/integrations/core';
import { toast } from 'sonner';

const TranscriptionPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setTranscription('');
  }, []);

  const handleTranscribe = async () => {
    if (!file) {
      toast.error('נא לבחור קובץ תחילה');
      return;
    }

    setIsTranscribing(true);
    setTranscription('');

    try {
      toast.info('מעלה קובץ...');
      const { file_url } = await uploadFile({ file });

      if (!file_url) {
        throw new Error('העלאת הקובץ נכשלה');
      }
      
      toast.info('הקובץ הועלה, שולח לתמלול...');
      const result = await transcribeAudio({ file_url });
      
      if (result.text) {
        setTranscription(result.text);
        toast.success('התמלול הושלם בהצלחה!');
      } else {
        throw new Error((result as any).error || 'שגיאה לא ידועה בתמלול');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`שגיאה בתמלול: ${errorMessage}`);
      setTranscription('לא ניתן היה להשלים את התמלול. אנא בדוק את הקונסול לקבלת פרטים נוספים ונסה שוב.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="relative text-center mb-8">
          <div className="absolute top-0 left-0">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 ml-2" />
                חזרה לעורך
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              תמלול אודיו
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">הפוך כל קובץ אודיו או וידאו לטקסט בעברית, באמצעות Whisper AI</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                שלב 1: העלאת קובץ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileSelect}
                acceptedTypes={["audio/mp3", "audio/wav", "audio/mp4", "audio/mpeg", "video/mp4", "video/quicktime", "video/webm"]}
                maxSize={25 * 1024 * 1024} // 25MB limit for Whisper API
              />
              {file && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    קובץ נבחר: {file.name}
                  </p>
                  <p className="text-xs text-green-600">
                    גודל: {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                שלב 2: תמלול
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleTranscribe}
                disabled={!file || isTranscribing}
                size="lg"
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isTranscribing ? 'מתמלל...' : 'התחל תמלול'}
              </Button>
            </CardContent>
          </Card>

          {isTranscribing && (
            <ProcessingStatus
              isProcessing={isTranscribing}
              currentStep="מעבד את הקובץ ושולח ל-Whisper API... תהליך זה עשוי לקחת מספר דקות."
            />
          )}

          {transcription && (
            <Card>
              <CardHeader>
                <CardTitle>התמלול שלך</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72 w-full rounded-md border p-4 bg-gray-50">
                  <p className="text-right whitespace-pre-wrap leading-relaxed">{transcription}</p>
                </ScrollArea>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    navigator.clipboard.writeText(transcription);
                    toast.success('התמלול הועתק!');
                  }}
                >
                  העתק טקסט
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPage;
