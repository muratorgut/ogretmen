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

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return <Button variant="outline" disabled>Yükleniyor...</Button>;

    return (
        <PDFDownloadLink
            document={<PerformanceChartPdf students={students} config={config} meta={meta} type={type} />}
            fileName={`${meta.className}_${type}_Cizelge.pdf`}
        >
            {({ loading }) => (
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" disabled={loading}>
                    {loading ? 'Hazırlanıyor...' : btnText}
                </Button>
            )}
        </PDFDownloadLink>
    );
};

export default PdfDownloadButton;
