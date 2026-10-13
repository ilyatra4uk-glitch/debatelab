export type DebateSide = "for" | "against";

export type DebateTurn = {
  id: string;
  debateId: string;
  speaker: "user" | "bot";
  content: string;
  createdAt: string;
};

export type DebateRecord = {
  id: string;
  userId: string;
  mode: "bot" | "friend";
  motion: string;
  side: DebateSide;
  status: "draft" | "active" | "judged";
  createdAt: string;
  updatedAt: string;
};

export type DebateScore = {
  id: string;
  debateId: string;
  userId: string;
  structure: number;
  logic: number;
  evidence: number;
  rebuttal: number;
  speakingStyle: number;
  overall: number;
  rank: string;
  feedback: string;
  createdAt: string;
};

export type ProfileStats = {
  debateCount: number;
  averageScore: number | null;
  currentRank: string;
  latestDebate: DebateRecord | null;
  latestScore: DebateScore | null;
  scoreHistory: DebateScore[];
  improvementTrend: {
    label: string;
    delta: number | null;
  };
  weakestSkill: {
    label: string;
    score: number | null;
  };
  focusRecommendation: string;
  recentArguments: Array<{
    id: string;
    motion: string;
    content: string;
    createdAt: string;
  }>;
};
