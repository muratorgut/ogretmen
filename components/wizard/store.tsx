"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface Student {
  id: string; // Benzersiz ID (Composite: No-Lesson-Class)
  studentNo?: string; // Gerçek Öğrenci Numarası (Görüntüleme için)
  name: string;
  y1?: number; // Yazılı 1
  y2?: number; // Yazılı 2
  p1?: number; // Performans 1 (e-Okul'daki)
  p2?: number; // Performans 2 (e-Okul'daki)
  distributeP1?: boolean; // P1 dağıtımı yapılsın mı?
  distributeP2?: boolean; // P2 dağıtımı yapılsın mı?

  // Metadata per student (since PDF might contain multiple classes)
  schoolName?: string;
  academicYear?: string;
  className?: string; // Sınıf/Şube (e.g. 9/A)
  lessonName?: string; // Ders (e.g. KİMYA)

  generatedScores?: Record<string, number>; // key: criteriaId, value: score
}

export interface RubricItem {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

export interface AppConfig {
  p1Name: string;
  p2Name: string;
  roundingRule: 1 | 5 | 10;
  rubricsP1: RubricItem[];
  rubricsP2: RubricItem[];
  teacherName: string;
  teacherBranch: string;
  principalName: string;
  reportDate?: string;
}

export type GeminiModel =
  | 'gemini-3-pro-preview'
  | 'gemini-3-flash-preview'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite-preview-02-05'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro';

interface AppState {
  step: number;
  file: File | null;
  meta: {
    lessonName: string;
    className: string;
  };
  students: Student[];
  config: AppConfig;
  apiKey?: string;
  geminiModel: GeminiModel;
  // Selection State (Moved from Step 1)
  parsedGroups: any[];
  selectionState: Record<number, { selected: boolean; p1: boolean; p2: boolean }>;
  isSelectionMode: boolean;
}

interface AppContextType extends AppState {
  setStep: (step: number) => void;
  setFile: (file: File) => void;
  setApiKey: (key: string) => void;
  setGeminiModel: (model: GeminiModel) => void;
  setParsedData: (meta: { lessonName: string; className: string }, students: Student[]) => void;

  // Selection Setters
  setParsedGroups: (groups: any[]) => void;
  setSelectionState: (state: Record<number, { selected: boolean; p1: boolean; p2: boolean }>) => void;
  setIsSelectionMode: (isSelectionMode: boolean) => void;

  updateConfig: (config: Partial<AppConfig>) => void;
  updateStudentScores: (studentId: string, scores: Record<string, number>) => void;
  reset: () => void;
  isConfigLoaded: boolean;
  saveConfig: (configOverride?: AppConfig) => Promise<void>;
}

export const defaultConfig: AppConfig = {
  p1Name: 'Derse Hazırlık ve Katılım',
  p2Name: 'Proje',
  roundingRule: 5,
  rubricsP1: [
    { id: 'p1_1', label: 'Hazırlıklı Gelme ve Materyal Kullanımı', maxScore: 20, description: '' },
    { id: 'p1_2', label: 'Derse İlgi ve Odaklanma', maxScore: 20, description: '' },
    { id: 'p1_3', label: 'Soru-Cevap ve Tartışmalara Katılım', maxScore: 20, description: '' },
    { id: 'p1_4', label: 'Bireysel ve Grupla Çalışma Becerisi', maxScore: 20, description: '' },
    { id: 'p1_5', label: 'Akademik Gelişim ve Uygulama', maxScore: 20, description: '' }
  ],
  rubricsP2: [
    { id: 'p2_1', label: 'İçeriğin Doğruluğu ve Kapsamlılığı', maxScore: 20, description: '' },
    { id: 'p2_2', label: 'Araştırma ve Kaynak Kullanımı', maxScore: 20, description: '' },
    { id: 'p2_3', label: 'Düzen, Tertip ve Estetik Görünüm', maxScore: 20, description: '' },
    { id: 'p2_4', label: 'Özgünlük ve Yaratıcılık', maxScore: 20, description: '' },
    { id: 'p2_5', label: 'Zamanlama ve Teslim Süreci', maxScore: 20, description: '' }
  ],
  teacherName: '',
  teacherBranch: '',
  principalName: '',
  reportDate: new Date().toISOString().split('T')[0] // Default to today
};

const defaultState: AppState = {
  step: 1,
  file: null,
  meta: { lessonName: '', className: '' },
  students: [],
  apiKey: '',
  geminiModel: 'gemini-2.0-flash',
  config: defaultConfig,
  parsedGroups: [],
  selectionState: {},
  isSelectionMode: false
};

import { useAuth } from '@/components/providers/auth-provider';
import { getUserConfig, saveUserConfig } from '@/lib/db-service';
import { useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const { user } = useAuth();
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Load config on mount/login
  useEffect(() => {
    if (user) {
      setIsConfigLoaded(false); // Reset on user change
      getUserConfig(user.uid).then((savedConfig) => {
        if (savedConfig) {
          setState((prev) => ({
            ...prev,
            config: { ...prev.config, ...savedConfig }
          }));
        }
        setIsConfigLoaded(true); // Mark as loaded whether we found data or not
      });
    } else {
      // If no user, technically config is "loaded" as default
      setIsConfigLoaded(true);
    }
  }, [user]);

  // Debounce config updates to avoid too many writes
  const [debouncedConfig] = useDebounce(state.config, 2000);

  // Save config when it changes (Auto-save)
  useEffect(() => {
    if (user && debouncedConfig && isConfigLoaded) {
      saveUserConfig(user.uid, debouncedConfig);
    }
  }, [debouncedConfig, user, isConfigLoaded]);

  const saveConfig = async (configOverride?: AppConfig) => {
    const configToSave = configOverride || state.config;
    if (user && configToSave) {
      await saveUserConfig(user.uid, configToSave);
    }
  };

  const setStep = (step: number) => setState(prev => ({ ...prev, step }));

  const setFile = (file: File) => setState(prev => ({ ...prev, file }));

  const setApiKey = (apiKey: string) => setState(prev => ({ ...prev, apiKey }));

  const setGeminiModel = (geminiModel: GeminiModel) => setState(prev => ({ ...prev, geminiModel }));

  const setParsedData = (meta: { lessonName: string; className: string }, students: Student[]) => {
    setState(prev => ({
      ...prev,
      meta,
      students,
      step: 2 // Auto advance to config
    }));
  };

  const setParsedGroups = (groups: any[]) => setState(prev => ({ ...prev, parsedGroups: groups }));
  const setSelectionState = (selectionState: Record<number, { selected: boolean; p1: boolean; p2: boolean }>) => setState(prev => ({ ...prev, selectionState }));
  const setIsSelectionMode = (isSelectionMode: boolean) => setState(prev => ({ ...prev, isSelectionMode }));

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig }
    }));
  };

  const updateStudentScores = (studentId: string, scores: Record<string, number>) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s =>
        s.id === studentId ? { ...s, generatedScores: { ...s.generatedScores, ...scores } } : s
      )
    }));
  };

  const reset = () => setState(defaultState);

  return (
    <AppContext.Provider value={{
      ...state,
      setStep,
      setFile,
      setApiKey,
      setGeminiModel,
      setParsedData,
      setParsedGroups,
      setSelectionState,
      setIsSelectionMode,
      updateConfig,
      updateStudentScores,
      reset,
      isConfigLoaded,
      saveConfig
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
