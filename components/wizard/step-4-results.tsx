"use client"

import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import dynamic from 'next/dynamic';

const PdfDownloadButton = dynamic(
    () => import('./pdf-download-button'),
    { ssr: false, loading: () => <Button variant="outline" disabled>PDF Yükleniyor...</Button> }
);

export default function Step4Results() {
    const { step, students, config, meta, file } = useAppStore();

    if (step !== 4) return null;

    return (
        <Card className="w-full max-w-6xl mx-auto mt-6">
            <CardHeader>
                <CardTitle>Sonuçlar ve Raporlama</CardTitle>
                <CardDescription>
                    Hesaplanan notları inceleyin ve çıktı alın.
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center py-10 space-y-6">

                <div className="text-center space-y-2 max-w-lg">
                    <div className="bg-green-100 text-green-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <FileDown className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">İşlem Tamamlandı!</h3>
                    <p className="text-gray-600">
                        Not dağıtımı başarıyla gerçekleştirildi. Aşağıdaki butona tıklayarak P1 ve P2 çizelgelerini tek bir PDF dosyası olarak indirebilirsiniz.
                    </p>
                </div>

                <div className="w-full max-w-md">
                    <PdfDownloadButton
                        students={students}
                        config={config}
                        meta={meta}
                        type="ALL"
                        btnText="PDF İNDİR"
                    />
                </div>

            </CardContent>
        </Card>
    );
}
