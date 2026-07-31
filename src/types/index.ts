import type { EvaluationResult, EnglishLevel, VocabularyItem } from '../services/geminiService';

export type { EvaluationResult, EnglishLevel, VocabularyItem };

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ContentMode = "generate" | "useInput" | "image";

export type QuestionType = 'fill_blank' | 'rearrange' | 'find_mistake' | 'complete_sentence';

export interface WrittenQuestion {
  id: string;
  type: QuestionType;
  questionText: string;
  suggestedWords?: string; // used for fill_blank or complete_sentence
  expectedAnswer: string;
  explanation: string;
}

export interface ExerciseData {
  questions: WrittenQuestion[]; // 30 questions
}

export interface AppState {
  topic: string;
  grammarTopic: string;
  level: EnglishLevel;
  apiKey: string;
  showApiKeyModal: boolean;
  imagePreview: string | null;
  aspectRatio: AspectRatio;
  isGenerating: boolean;
  isAudioLoading: boolean;
  generatedImage: string | null;
  generatedPrompt: string | null;
  readingText: string | null;
  translationText: string | null;
  readingText2: string | null;
  translationText2: string | null;
  vocabulary: VocabularyItem[];
  showTranslation: boolean;
  generatedTopicName: string | null;
  error: string | null;
  contentMode: ContentMode;
  exerciseData: ExerciseData | null;
  exerciseScore: number | null;
  isDragging: boolean;
  isProcessingFile: boolean;
  isDownloading: boolean;
  isPlaying: boolean;
  audioUrl: string | null;
  audioUrl2: string | null;
  // Recording
  isRecording: boolean;
  isEvaluating: boolean;
  evaluation: EvaluationResult | null;
  studentName: string;
  teacherName: string;
  showCertificate: boolean;
}
