"use client"

import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AppConfig, Student } from './store';
import dynamic from 'next/dynamic';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button variant="outline" disabled>Kütüphane Yükleniyor...</Button> }
);

const PerformanceChartPdf = dynamic(
    () => import('@/components/pdf-document').then(mod => mod.PerformanceChartPdf),
    { ssr: false }
);

interface Props {
    students: Student[];
    config: AppConfig;
    meta: { lessonName: string; className: string };
    type: 'P1' | 'P2' | 'ALL';
    btnText: string;
}


class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            const err = this.state.error;
            let errorMessage = "Bilinmeyen Hata";

            if (err) {
                if (typeof err === 'string') errorMessage = err;
                else if (err instanceof Error) errorMessage = err.message + '\n' + err.stack;
                else try { errorMessage = JSON.stringify(err, Object.getOwnPropertyNames(err), 2); } catch (e) { errorMessage = String(err); }
            }

            return (
                <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-sm overflow-auto max-h-[300px]">
                    <p className="font-bold">PDF Oluşturma Hatası:</p>
                    <pre className="mt-1 text-xs whitespace-pre-wrap font-mono">
                        {errorMessage}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

const PdfDownloadButton = ({ students, config, meta, type, btnText }: Props) => {
    const [isClient, setIsClient] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return <Button variant="outline" disabled>Yükleniyor...</Button>;

    if (!isGenerating) {
        return (
            <Button
                variant="outline"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => setIsGenerating(true)}
            >
                {btnText} (Hazırla)
            </Button>
        );
    }

    return (
        <ErrorBoundary>
            <div className="flex gap-2 items-center w-full">
                <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 h-9 text-gray-500"
                    onClick={() => setIsGenerating(false)}
                >
                    X
                </Button>
                <div className="flex-1">
                    <PDFDownloadLink
                        document={<PerformanceChartPdf students={students} config={config} meta={meta} type={type} />}
                        fileName={`${meta.className}_${type}_Cizelge.pdf`}
                        className="w-full block"
                    >
                        {({ loading, error }) => {
                            if (error) {
                                console.error("PDF Generation Error:", error);
                                return "Hata oluştu (Tekrar deneyin)";
                            }
                            return (
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                    disabled={loading}
                                >
                                    {loading ? 'PDF Hazırlanıyor...' : 'İNDİR'}
                                </Button>
                            );
                        }}
                    </PDFDownloadLink>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default PdfDownloadButton;
