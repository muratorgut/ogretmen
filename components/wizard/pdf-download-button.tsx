"use client"

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PerformanceChartPdf } from '@/components/pdf-document';
import { Button } from '@/components/ui/button';
import { AppConfig, Student } from './store';

interface Props {
    students: Student[];
    config: AppConfig;
    meta: { lessonName: string; className: string };
    type: 'P1' | 'P2' | 'ALL';
    btnText: string;
}

const PdfDownloadButton = ({ students, config, meta, type, btnText }: Props) => (
    <PDFDownloadLink
        document={<PerformanceChartPdf students={students} config={config} meta={meta} type={type} />}
        fileName={`${meta.className}_${type}_Cizelge.pdf`}
    >
        {({ blob, url, loading, error }) => (
            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" disabled={loading}>
                {loading ? 'Hazırlanıyor...' : btnText}
            </Button>
        )}
    </PDFDownloadLink>
);

export default PdfDownloadButton;
