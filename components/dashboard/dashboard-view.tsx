"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserHeaderProfile } from '@/components/shared/user-header-profile';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

export default function DashboardView() {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <FileSpreadsheet className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Öğretmen Asistanı</h1>
                    </div>

                    <UserHeaderProfile />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Welcome Message */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                        Hoş Geldiniz, Değerli Öğretmenim
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Eğitim süreçlerinizi hızlandıracak yapay zeka destekli araçlar burada.
                    </p>

                    {!user && (
                        <div className="mt-8 bg-white p-6 rounded-xl border border-indigo-100 shadow-sm max-w-3xl mx-auto text-left">
                            <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Neden Giriş Yapmalısınız?
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <ul className="space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span><strong>Ayarlarınız Kaybolmaz:</strong> Rubrikleriniz, okul ve müdür bilgileriniz her seferinde hazır gelir.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span><strong>Heryerden Erişim:</strong> Okulda veya evde, hesabınıza giriş yaparak kaldığınız yerden devam edebilirsiniz.</span>
                                    </li>
                                </ul>
                                <ul className="space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span><strong>Öncelikli Erişim:</strong> Yeni eklenecek modülleri (Sınav Analizi vb.) ilk siz denersiniz.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span><strong>Veri Güvenliği:</strong> Verileriniz sadece sizin hesabınıza özel şifreli olarak saklanır.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Performance Distributor Card */}
                    <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-indigo-500 cursor-pointer" onClick={() => router.push('/tools/performance')}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-700">
                                <FileSpreadsheet className="h-5 w-5" />
                                Performans Notu Dağıtıcı
                            </CardTitle>
                            <CardDescription>
                                e-Okul Puan Çizelgesini yükleyin, kriterlere göre adil not dağıtımı yapın.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-green-500" />
                                    Adil ve Tutarlı Puanlama
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-green-500" />
                                    Matematiksel Doğruluk
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-green-500" />
                                    Otomatik PDF Çıktısı
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                                Başla <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Placeholder for future modules */}
                    <Card className="opacity-60 border-dashed border-2 bg-slate-50">
                        <CardHeader>
                            <CardTitle className="text-gray-400">Yeni Modül</CardTitle>
                            <CardDescription>Çok yakında...</CardDescription>
                        </CardHeader>
                        <CardContent className="h-32 flex items-center justify-center text-gray-400 text-sm">
                            Sınav Analizi, Zümre Asistanı vb.
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    );
}
