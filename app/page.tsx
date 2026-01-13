"use client";

import { AppProvider } from '@/components/wizard/store';
import WizardContainer from '@/components/wizard/wizard-container';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppProvider>
        <WizardContainer />
      </AppProvider>
    </main>
  );
}
