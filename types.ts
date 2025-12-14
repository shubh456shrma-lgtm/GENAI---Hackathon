export enum ViewState {
  AUTH = 'AUTH',
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  DASHBOARD = 'DASHBOARD',
}

export enum ExamType {
  UNIVERSITY = 'University Final',
  COMPETITIVE = 'Competitive Exam (MCQ)',
  SCHOOL = 'School Test',
  GENERAL = 'General Knowledge'
}

export enum TimeFrame {
  ONE_DAY = '1 Day',
  ONE_WEEK = '1 Week',
  ONE_MONTH = '1 Month'
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
}

export interface ExamStrategy {
  priorityTopics: string[];
  skipTopics: string[]; // Low probability
  focusAdvice: string;
}

export interface LectureData {
  title: string;
  transcript: string; // The raw text
  videoUrl?: string; // YouTube URL if available
  videoId?: string; // YouTube ID for embedding
}

export interface Chapter {
  timestamp: string; // e.g., "05:30"
  title: string;
  summary: string;
}

export interface Formula {
  expression: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AppState {
  view: ViewState;
  user: User | null;
  lecture: LectureData | null;
  examType: ExamType;
  timeFrame: TimeFrame;
  summary: string;
  chapters: Chapter[];
  formulas: Formula[];
  strategy: ExamStrategy | null;
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  cheatSheet: string;
  chatHistory: ChatMessage[];
  error: string | null;
  successMessage?: string | null;
}
