"use client"

import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Table as TableIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { exportToOriginalExcel } from '@/lib/excel-export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PdfDownloadButton = dynamic(
    () => import('./pdf-download-button'),
    { ssr: false, loading: () => <Button variant="outline" disabled>PDF Yükleniyor...</Button> }
);

export default function Step4Results() {
    const { step, students, config, meta, file } = useAppStore();

    if (step !== 4) return null;

    const handleExcelDownload = async () => {
        if (!file) return;
        try {
            const blob = await exportToOriginalExcel(file, students);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `e-okul_updated_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
        } catch (e) {
            alert("Excel oluşturulurken hata: " + e);
        }
    };

    return (
        <Card className="w-full max-w-6xl mx-auto mt-6">
            <CardHeader>
                <CardTitle>Sonuçlar ve Raporlama</CardTitle>
                <CardDescription>
                    Hesaplanan notları inceleyin ve çıktı alın.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="export">
                    <TabsList>
                        <TabsTrigger value="export">Dosya Çıktıları</TabsTrigger>
                        <TabsTrigger value="list">Öğrenci Listesi</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="mt-4">
                        <div className="rounded-md border max-h-[500px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">No</TableHead>
                                        <TableHead>Ad Soyad</TableHead>
                                        <TableHead>Sınıf / Ders</TableHead>
                                        <TableHead className="text-right">P1 (Hedef)</TableHead>
                                        <TableHead className="text-right">P2 (Hedef)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((s) => (
                                        <TableRow key={`${s.id}-${s.className}`}>
                                            <TableCell className="font-medium">{s.id}</TableCell>
                                            <TableCell>{s.name}</TableCell>
                                            <TableCell className="text-sm text-gray-500">{s.className} - {s.lessonName}</TableCell>
                                            <TableCell className="text-right font-bold text-blue-600">{s.p1}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">{s.p2}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Not: Detaylı kriter puanlarını PDF raporunda görebilirsiniz.</p>
                    </TabsContent>

                    <TabsContent value="export" className="mt-4 grid gap-6 md:grid-cols-2">

                        <div className="border rounded-lg p-6 space-y-4 bg-slate-50">
                            <h3 className="font-semibold flex items-center gap-2">
                                <FileDown className="h-5 w-5 text-green-600" />
                                e-Okul Excel Dışa Aktar
                            </h3>
                            <p className="text-sm text-gray-600">
                                Orijinal e-Okul dosyasının üzerine P1 ve P2 notlarını işleyerek yeni bir Excel dosyası oluşturur. Sadece toplam P1/P2 notları aktarılır.
                            </p>
                            {file && file.name.endsWith('.pdf') ? (
                                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                    ⚠️ PDF dosyası yüklediniz. Excel export için orijinal e-Okul Excel dosyasını (.xlsx) yüklemeniz gerekmektedir.
                                </p>
                            ) : (
                                <Button className="w-full bg-green-700 hover:bg-green-800" onClick={handleExcelDownload} disabled={!file}>
                                    Excel İndir (.xlsx)
                                </Button>
                            )}
                        </div>

                        <div className="border rounded-lg p-6 space-y-4 bg-slate-50">
                            <h3 className="font-semibold flex items-center gap-2">
                                <TableIcon className="h-5 w-5 text-red-600" />
                                Performans Çizelgeleri (PDF)
                            </h3>
                            <p className="text-sm text-gray-600">
                                Sınıf içi asmak veya arşivlemek için detaylı, kriter bazlı not dağılım çizelgesi.
                            </p>

                            <div className="grid gap-2">
                                <PdfDownloadButton
                                    students={students}
                                    config={config}
                                    meta={meta}
                                    type="P1"
                                    btnText={`P1 (${config.p1Name}) PDF İndir`}
                                />

                                <PdfDownloadButton
                                    students={students}
                                    config={config}
                                    meta={meta}
                                    type="P2"
                                    btnText={`P2 (${config.p2Name}) PDF İndir`}
                                />

                                <div className="pt-2 border-t mt-2">
                                    <PdfDownloadButton
                                        students={students}
                                        config={config}
                                        meta={meta}
                                        type="ALL"
                                        btnText="Tümünü Tek PDF İndir (P1 + P2)"
                                    />
                                </div>
                            </div>
                        </div>

                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
