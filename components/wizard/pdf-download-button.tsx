"use client"

import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AppConfig, Student } from './store';
import dynamic from 'next/dynamic';

// Imports moved inside the handler to prevent early loading issues

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
    const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'ERROR'>('IDLE');
    const [errorDetails, setErrorDetails] = useState<string>("");

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleDownload = async () => {
        try {
            setStatus('GENERATING');
            setErrorDetails("");

            // Dynamically import the renderer to ensure it runs on client
            const { pdf } = await import('@react-pdf/renderer');
            // Dynamically import the document
            const { PerformanceChartPdf } = await import('@/components/pdf-document');

            const blob = await pdf(
                <PerformanceChartPdf
                    students={students}
                    config={config}
                    meta={meta}
                    type={type}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
            const safeTeacherName = config.teacherName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, "").replace(/\s+/g, "_") || "Ogretmen";
            // Normalizing Turkish characters for filename safety isn't strictly necessary for modern OS but good for compatibility.
            // Leaving as is for now, but ensured structure is correct.

            // Construct filename: "performans"_$öğretmen_adı_soyadı_$rastgele_3_basamaklı_sayı
            link.download = `performans_${safeTeacherName}_${randomNum}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setStatus('IDLE');
        } catch (err: any) {
            console.error("Manual PDF Generation Failed:", err);
            setStatus('ERROR');

            let msg = "Bilinmeyen Hata";
            if (err) {
                if (typeof err === 'string') msg = err;
                else if (err instanceof Error) msg = err.message + "\\n" + err.stack;
                else msg = JSON.stringify(err);
            }
            setErrorDetails(msg);
        }
    };

    if (!isClient) return <Button variant="outline" disabled>Yükleniyor...</Button>;

    if (status === 'ERROR') {
        return (
            <div className="space-y-2">
                <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-sm overflow-auto max-h-[300px]">
                    <p className="font-bold">PDF Oluşturma Hatası:</p>
                    <pre className="mt-1 text-xs whitespace-pre-wrap font-mono">
                        {errorDetails}
                    </pre>
                </div>
                <Button variant="outline" onClick={() => setStatus('IDLE')} className="w-full">
                    Tekrar Dene
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="outline"
            className={`w-full ${status === 'GENERATING' ? 'opacity-50 cursor-wait' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            onClick={handleDownload}
            disabled={status === 'GENERATING'}
        >
            {status === 'GENERATING' ? 'PDF Oluşturuluyor...' : btnText}
        </Button>
    );
};

export default PdfDownloadButton;
