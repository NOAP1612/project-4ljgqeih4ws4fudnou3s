import { useCallback } from 'react';
import { invokeLLM } from '@/integrations/core';

interface StrongSentence {
  sentence: string;
  reason: string;
  type: 'Hook' | 'Insight' | 'Question' | 'Punchline';
  start_time?: number;
  end_time?: number;
}

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

export const useTextAnalysis = () => {
  const analyzeTranscriptForStrongSegments = useCallback(async (
    fullTranscript: string
  ): Promise<StrongSentence[]> => {
    try {
      const prompt = `You are an expert podcast producer. Your task is to analyze the following podcast transcript and identify the most powerful and engaging sentences that would make great hooks or clips for social media reels.

Analyze the provided transcript and return a JSON array of objects. Each object should represent a single "strong" sentence and must contain the following fields:
- "sentence": The exact sentence from the transcript.
- "reason": A brief explanation of why this sentence is powerful (e.g., "Intriguing question", "Controversial statement", "Actionable advice", "Emotional peak").
- "type": Classify the sentence into one of these categories: "Hook", "Insight", "Question", "Punchline".

The transcript is:
---
${fullTranscript}
---

Return ONLY the JSON array, without any additional text or explanations.`;

      const response = await invokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            strong_sentences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sentence: { type: "string" },
                  reason: { type: "string" },
                  type: { type: "string", enum: ["Hook", "Insight", "Question", "Punchline"] }
                },
                required: ["sentence", "reason", "type"]
              }
            }
          },
          required: ["strong_sentences"]
        }
      });

      return response.strong_sentences || [];
    } catch (error) {
      console.error('Text analysis error:', error);
      return [];
    }
  }, []);

  const mapSentencesToTimestamps = useCallback((
    strongSentences: StrongSentence[],
    transcriptionSegments: TranscriptionSegment[]
  ): StrongSentence[] => {
    return strongSentences.map(sentence => {
      // Find the segment that contains this sentence
      const matchingSegment = transcriptionSegments.find(segment => 
        segment.text.includes(sentence.sentence) || 
        sentence.sentence.includes(segment.text.trim())
      );

      if (matchingSegment) {
        return {
          ...sentence,
          start_time: matchingSegment.start,
          end_time: matchingSegment.end
        };
      }

      // If exact match not found, try fuzzy matching
      const fuzzyMatch = transcriptionSegments.find(segment => {
        const segmentWords = segment.text.toLowerCase().split(/\s+/);
        const sentenceWords = sentence.sentence.toLowerCase().split(/\s+/);
        
        // Check if at least 70% of sentence words are in the segment
        const matchingWords = sentenceWords.filter(word => 
          segmentWords.some(segWord => segWord.includes(word) || word.includes(segWord))
        );
        
        return matchingWords.length / sentenceWords.length >= 0.7;
      });

      if (fuzzyMatch) {
        return {
          ...sentence,
          start_time: fuzzyMatch.start,
          end_time: fuzzyMatch.end
        };
      }

      return sentence;
    }).filter(sentence => sentence.start_time !== undefined);
  }, []);

  const findStrongSegmentsFromText = useCallback((
    transcriptionSegments: TranscriptionSegment[],
    strongSentences: StrongSentence[]
  ): Array<{ start: number; end: number; reason: string; type: string; score: number }> => {
    const mappedSentences = mapSentencesToTimestamps(strongSentences, transcriptionSegments);
    
    return mappedSentences.map(sentence => {
      // Assign scores based on type
      const typeScores = {
        'Hook': 1.5,
        'Punchline': 1.3,
        'Question': 1.2,
        'Insight': 1.1
      };

      return {
        start: sentence.start_time!,
        end: sentence.end_time!,
        reason: sentence.reason,
        type: sentence.type,
        score: typeScores[sentence.type] || 1.0
      };
    });
  }, [mapSentencesToTimestamps]);

  return {
    analyzeTranscriptForStrongSegments,
    mapSentencesToTimestamps,
    findStrongSegmentsFromText
  };
};