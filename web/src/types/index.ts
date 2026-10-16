export type User = {
  id: string;
  email: string;
};

export type Task = {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  completedAt: string | null;
  createdAt: string;
  total: number;
  done: number;
};

export type Subtask = {
  id: number;
  taskId: number;
  title: string;
  done: boolean;
  scheduledDate: string;
  taskTitle: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type StatsOverview = {
  todayDone: number;
  todayTotal: number;
  weekDone: number;
  weekTotal: number;
  streak: number;
  activeTasks: number;
};