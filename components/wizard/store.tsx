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
}

interface AppContextType extends AppState {
  setStep: (step: number) => void;
  setFile: (file: File) => void;
  setApiKey: (key: string) => void;
  setGeminiModel: (model: GeminiModel) => void;
  setParsedData: (meta: { lessonName: string; className: string }, students: Student[]) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  updateStudentScores: (studentId: string, scores: Record<string, number>) => void;
  reset: () => void;
}

const defaultState: AppState = {
  step: 1,
  file: null,
  meta: { lessonName: '', className: '' },
  students: [],
  apiKey: '',
  geminiModel: 'gemini-3-flash-preview',
  config: {
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
    principalName: ''
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);

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
      updateConfig,
      updateStudentScores,
      reset
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
