import { AppProvider } from '@/components/wizard/store';
import WizardContainer from '@/components/wizard/wizard-container';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppProvider>
        <WizardContainer />
      </AppProvider>
    </main>
  );
}
