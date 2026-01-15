"use client"

import { useAuth } from '@/components/providers/auth-provider';
import { useAppStore } from './store';
import Step1Upload from './step-1-upload';
import Step2Config from './step-2-config';
import Step3Processing from './step-3-processing';
import Step4Results from './step-4-results';
import { UserHeaderProfile } from '@/components/shared/user-header-profile';

// Progress bar can go here

export default function WizardContainer() {
    const { step, meta } = useAppStore();
    const { user, logout } = useAuth();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header / Stepper UI */}
            <div className="mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Performans Notu Dağıtıcı</h1>
                        <p className="text-gray-500 mt-1">
                            {meta.lessonName && meta.className ? `${meta.lessonName} - ${meta.className}` : 'Yeni Performans Dağıtımı'}
                        </p>
                    </div>
                    <UserHeaderProfile />
                </div>

                <div className="flex items-center space-x-2 text-sm">
                    <div className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>1. Yükle</div>
                    <div className={`h-1 w-8 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                    <div className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>2. Ayarlar</div>
                    <div className={`h-1 w-8 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                    <div className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>3. Dağıt</div>
                    <div className={`h-1 w-8 ${step >= 4 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                    <div className={`px-3 py-1 rounded-full ${step >= 4 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>4. Sonuç</div>
                </div>
            </div>

            <Step1Upload />
            <Step2Config />
            <Step3Processing />
            <Step4Results />
            {/* Other steps will be added here */}
        </div>
    );
}
