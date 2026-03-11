import { create } from 'zustand';
import { api } from '../api/client';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string | null;
  project_name: string | null;
  project_color: string | null;
  labels: { id: string; name: string; color: string }[];
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface KanbanData {
  todo: Task[];
  in_progress: Task[];
  review: Task[];
  done: Task[];
}

interface TaskState {
  kanban: KanbanData;
  tasks: Task[];
  calendarTasks: Task[];
  loading: boolean;
  fetchKanban: (projectId?: string) => Promise<void>;
  fetchTasks: (params?: Record<string, string>) => Promise<void>;
  fetchCalendar: (month: number, year: number) => Promise<void>;
  createTask: (data: any) => Promise<Task>;
  updateTask: (id: string, data: any) => Promise<Task>;
  moveTask: (id: string, status: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  kanban: { todo: [], in_progress: [], review: [], done: [] },
  tasks: [],
  calendarTasks: [],
  loading: false,

  fetchKanban: async (projectId) => {
    set({ loading: true });
    try {
      const data = await api.getKanban(projectId);
      set({ kanban: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchTasks: async (params) => {
    set({ loading: true });
    try {
      const data = await api.getTasks(params);
      set({ tasks: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchCalendar: async (month, year) => {
    try {
      const data = await api.getCalendar(month, year);
      set({ calendarTasks: data });
    } catch {}
  },

  createTask: async (data) => {
    const task = await api.createTask(data);
    return task;
  },

  updateTask: async (id, data) => {
    const task = await api.updateTask(id, data);
    return task;
  },

  moveTask: async (id, status) => {
    await api.moveTask(id, status);
  },

  deleteTask: async (id) => {
    await api.deleteTask(id);
  },
}));
