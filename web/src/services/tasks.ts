import { api } from '@/lib/api';
import type { Task, Subtask, StatsOverview  } from '@/types';
import type { TaskDetail, WeekStat } from '@/types';

export const getTasks = () =>
  api.get<Task[]>('/api/tasks').then(r => r.data);

export const getTodaySubtasks = () =>
  api.get<Subtask[]>('/api/tasks/today').then(r => r.data);

export const createTask = (payload: {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  dailySubtasks?: string[];
  customSubtasks?: { date: string; title: string }[];
}) => api.post('/api/tasks', payload).then(r => r.data);

export const toggleSubtask = (id: number, done: boolean) =>
  api.patch<Subtask>(`/api/subtasks/${id}`, { done }).then(r => r.data);

export const deleteTask = (id: number) =>
  api.delete(`/api/tasks/${id}`).then(r => r.data);

export const getHistoryTasks = () =>
  api.get<Task[]>('/api/tasks/history').then(r => r.data);

export const aiPlanTask = (goal: string) =>
  api.post<{
    startDate: string;
    endDate: string;
    dailySubtasks?: string[];
    customSubtasks?: { date: string; title: string }[];
  }>('/api/tasks/ai-plan', { goal }).then(r => r.data); 

export const getStatsOverview = () =>
  api.get<StatsOverview>('/api/stats/overview').then(r => r.data);

export const getTaskDetail = (id: number) =>
  api.get<TaskDetail>(`/api/tasks/${id}`).then(r => r.data);

export const updateTask = (
  id: number,
  payload: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }
) => api.patch(`/api/tasks/${id}`, payload).then(r => r.data);

export const getWeekStats = () =>
  api.get<WeekStat[]>('/api/stats/week').then(r => r.data);