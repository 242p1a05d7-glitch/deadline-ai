export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  timezone?: string;
  createdAt: string;
  dailyGoalMinutes: number;
  focusScore: number;
  completionRate: number;
}

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string; // ISO String
  estimatedMinutes: number;
  actualMinutesSpent: number;
  priority: PriorityLevel;
  status: TaskStatus;
  riskScore: number; // 0 to 100
  riskExplanation?: string;
  recoveryPlan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  userId: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetDate: string; // ISO String
  progress: number; // 0 to 100
  isCompleted: boolean;
  createdAt: string;
}

export type TimeBlockType = 'task' | 'calendar' | 'focus' | 'break';

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  taskId?: string;
  type: TimeBlockType;
}

export interface Schedule {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timeBlocks: TimeBlock[];
  createdAt: string;
}

export interface ProductivityLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  completedTasks: number;
  missedDeadlines: number;
  score: number;
  createdAt: string;
}

export type RecommendationType = 'risk_mitigation' | 'habit_improvement' | 'schedule_adjustment';

export interface AgentRecommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AgentState {
  id: 'planner' | 'risk' | 'coach' | 'recovery';
  name: string;
  role: string;
  status: 'idle' | 'planning' | 'auditing' | 'coaching' | 'recovering';
  lastAction: string;
  model: string;
}

export interface BurnoutMetrics {
  riskPercentage: number;
  mentalWorkloadScore: number; // 0 to 10
  stressIndicators: string[];
  recommendation: string;
}

export interface AdaptiveProfile {
  preferredWorkingHours: string; // e.g. "Morning (09:00 - 12:00)"
  completionSpeedFactor: number; // e.g. 1.2 (tasks take 20% longer than estimated)
  optimalFocusPeriod: number; // e.g. 45 (minutes before needing a break)
  taskSuccessRate: number; // percentage
  weeklyProductiveGapsDetected: number;
}

export interface SimulationResult {
  headline: string;
  deadlineImpact: string;
  riskScoreChange: number; // positive or negative
  futureWorkloadChange: string;
  alternativeSuggestion: string;
  isViable: boolean;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  xpValue: number;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserGamification {
  xp: number;
  level: number;
  nextLevelXp: number;
  currentStreak: number;
  bestStreak: number;
  badges: AchievementBadge[];
}

export interface GitHubProfile {
  username: string;
  avatarUrl: string;
  name: string;
  bio: string;
  htmlUrl: string;
  publicRepos: number;
}

export interface GitHubRepo {
  name: string;
  description: string;
  htmlUrl: string;
  openIssuesCount: number;
}


