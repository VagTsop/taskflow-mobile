import { create } from 'zustand';
import { api } from '../api/client';

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  task_count: number;
  done_count: number;
  created_at: string;
}

interface ProjectState {
  projects: Project[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (data: any) => Promise<Project>;
  updateProject: (id: string, data: any) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const data = await api.getProjects();
      set({ projects: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createProject: async (data) => {
    const project = await api.createProject(data);
    set((s) => ({ projects: [project, ...s.projects] }));
    return project;
  },

  updateProject: async (id, data) => {
    const project = await api.updateProject(id, data);
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? project : p)) }));
    return project;
  },

  deleteProject: async (id) => {
    await api.deleteProject(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },
}));
