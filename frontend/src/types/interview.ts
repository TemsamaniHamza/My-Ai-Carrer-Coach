export type InterviewType = 'behavioral' | 'technical' | 'mixed';

export interface InterviewEvaluation {
  score: number;
  feedback: string;
}

export interface InterviewMessage {
  role: 'assistant' | 'user';
  content: string;
  evaluation: InterviewEvaluation | null;
  createdAt: string;
}

export interface StartSessionResponse {
  sessionId: string;
  status: 'active' | 'completed';
  type: InterviewType;
  question: string;
}

export interface SubmitAnswerResponse {
  evaluation: InterviewEvaluation;
  nextQuestion: string | null;
  status: 'active' | 'completed';
  questionNumber: number;
  totalQuestions: number;
}

export interface InterviewSessionListItem {
  id: string;
  status: 'active' | 'completed';
  type: InterviewType;
  createdAt: string;
  firstQuestion: string | null;
}

export interface InterviewSessionDetail {
  id: string;
  status: 'active' | 'completed';
  type: InterviewType;
  createdAt: string;
  messages: InterviewMessage[];
}
