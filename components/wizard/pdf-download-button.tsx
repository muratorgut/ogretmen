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
    );
};

export default PdfDownloadButton;
