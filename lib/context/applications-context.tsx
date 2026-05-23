'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { JobApplication } from '@prisma/client';

interface ApplicationsContextType {
  applications: JobApplication[];
  loading: boolean;
  error: string | null;
  fetchApplications: () => Promise<void>;
  updateApplication: (id: string, updates: Partial<JobApplication>) => void;
  addApplication: (app: JobApplication) => void;
  removeApplication: (id: string) => void;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

type Action =
  | { type: 'SET_APPLICATIONS'; payload: JobApplication[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_APPLICATION'; payload: JobApplication }
  | { type: 'ADD_APPLICATION'; payload: JobApplication }
  | { type: 'REMOVE_APPLICATION'; payload: string };

function reducer(
  state: { applications: JobApplication[]; loading: boolean; error: string | null },
  action: Action
) {
  switch (action.type) {
    case 'SET_APPLICATIONS':
      return { ...state, applications: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_APPLICATION':
      return {
        ...state,
        applications: state.applications.map((app) =>
          app.id === action.payload.id ? action.payload : app
        )
      };
    case 'ADD_APPLICATION':
      return { ...state, applications: [action.payload, ...state.applications] };
    case 'REMOVE_APPLICATION':
      return {
        ...state,
        applications: state.applications.filter((app) => app.id !== action.payload)
      };
    default:
      return state;
  }
}

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    applications: [],
    loading: false,
    error: null
  });

  const fetchApplications = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch('/api/applications');
      if (!res.ok) throw new Error('Failed to fetch');
      const { data } = await res.json();
      dispatch({ type: 'SET_APPLICATIONS', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load applications' });
    }
  };

  const updateApplication = (id: string, updates: Partial<JobApplication>) => {
    const app = state.applications.find((a) => a.id === id);
    if (app) {
      dispatch({ type: 'UPDATE_APPLICATION', payload: { ...app, ...updates } });
    }
  };

  const addApplication = (app: JobApplication) => {
    dispatch({ type: 'ADD_APPLICATION', payload: app });
  };

  const removeApplication = (id: string) => {
    dispatch({ type: 'REMOVE_APPLICATION', payload: id });
  };

  return (
    <ApplicationsContext.Provider
      value={{
        ...state,
        fetchApplications,
        updateApplication,
        addApplication,
        removeApplication
      }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error('useApplications must be used within ApplicationsProvider');
  }
  return context;
}
