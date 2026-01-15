"use client"

import React, { useState } from 'react';
import { useAppStore, GeminiModel } from './store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { parseESchoolXls } from '@/lib/parser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Step1Upload() {
    const {
        setFile,
        setParsedData,
        step,
        setApiKey: setStoreApiKey,
        setGeminiModel: setStoreGeminiModel,
        geminiModel: storeGeminiModel,
        apiKey: storeApiKey,
        // New Store Properties and Setters
        parsedGroups,
        setParsedGroups,
        selectionState,
        setSelectionState,
        isSelectionMode,
        setIsSelectionMode
    } = useAppStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState(storeApiKey || '');
    const [geminiModel, setGeminiModel] = useState<GeminiModel>(storeGeminiModel || 'gemini-2.0-flash');
    const [progressText, setProgressText] = useState<string>("");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Optional check: if apiKey is empty, we assume backend env var is set
        // if (!apiKey) { ... } -> Removed mandatory check

        // Save to global store
        setStoreApiKey(apiKey);
        setStoreGeminiModel(geminiModel);

        setLoading(true);
        setError(null);
        setWarning(null);
        setParsedGroups([]);
        setSelectionState({});
        setIsSelectionMode(false);

        try {
            setFile(file);

            // Dynamic import of pdf-lib to avoid SSR issues
            const { PDFDocument } = await import('pdf-lib');

            // Load the PDF
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();

            if (pageCount === 0) throw new Error("PDF dosyası boş veya okunamadı.");

            const tempGroups: any[] = [];
            let processedPages = 0;

            // Process Page by Page
            for (let i = 0; i < pageCount; i++) {
                setLoading(true);
                setProgressText(`Sayfa ${i + 1} / ${pageCount} analiz ediliyor...`);

                // Extract single page
                const newDoc = await PDFDocument.create();
                const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
                newDoc.addPage(copiedPage);
                const base64Uri = await newDoc.saveAsBase64({ dataUri: true });

                // Call API for this page
                const response = await fetch('/api/parse-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file: base64Uri, apiKey, geminiModel })
                });

                if (response.status === 401) {
                    throw new Error("API Key hatası. Lütfen geçerli bir anahtar girin veya sistem yöneticisine başvurun.");
                }

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(`Sayfa ${i + 1} işlenirken hata: ${err.error || 'Bilinmeyen hata'}`);
                }

                const data = await response.json();

                if (data.classes && data.classes.length > 0) {
                    tempGroups.push(...data.classes);
                }

                processedPages++;
            }

            if (tempGroups.length === 0) {
                throw new Error("PDF'den sınıf veya öğrenci verisi okunamadı.");
            }

            // Successfully parsed everything. Now Enter Selection Mode.
            setParsedGroups(tempGroups);

            // Initialize selection state: All selected, P1 and P2 enabled by default
            const initialSelection: Record<number, { selected: boolean; p1: boolean; p2: boolean }> = {};
            tempGroups.forEach((_, idx) => {
                initialSelection[idx] = { selected: true, p1: true, p2: true };
            });
            setSelectionState(initialSelection);

            setIsSelectionMode(true);

        } catch (err: any) {
            setError(err.message || "Dosya okunurken bir hata oluştu.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroupSelection = (index: number) => {
        const prev = selectionState[index] || { selected: false, p1: false, p2: false };
        setSelectionState({
            ...selectionState,
            [index]: { ...prev, selected: !prev.selected }
        });
    };

    const toggleP1 = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const prev = selectionState[index];
        setSelectionState({
            ...selectionState,
            [index]: { ...prev, p1: !prev.p1 }
        });
    };

    const toggleP2 = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const prev = selectionState[index];
        setSelectionState({
            ...selectionState,
            [index]: { ...prev, p2: !prev.p2 }
        });
    };

    const handleConfirmSelection = () => {
        const selectedIndices = Object.keys(selectionState)
            .map(Number)
            .filter(idx => selectionState[idx].selected);

        if (selectedIndices.length === 0) {
            setError("Lütfen en az bir sınıf seçiniz.");
            return;
        }

        const allStudents: any[] = [];

        selectedIndices.forEach(idx => {
            const cls = parsedGroups[idx];
            const state = selectionState[idx];

            const classStudents = cls.students.map((s: any) => ({
                id: `${s.studentNo}-${cls.metadata.lessonName}-${cls.metadata.className}`.replace(/\s+/g, '_'),
                studentNo: s.studentNo,
                name: s.name,
                y1: 0,
                y2: 0,
                p1: s.p1,
                p2: s.p2,
                distributeP1: state.p1,
                distributeP2: state.p2,
                schoolName: cls.metadata.schoolName,
                academicYear: cls.metadata.academicYear,
                className: cls.metadata.className,
                lessonName: cls.metadata.lessonName
            }));
            allStudents.push(...classStudents);
        });

        // Filter out zero/empty values ONLY if that specific performance type is selected for distribution
        const studentsWithIssues = allStudents.filter(s => {
            const p1Issue = s.distributeP1 && (s.p1 === 0 || s.p1 === null);
            const p2Issue = s.distributeP2 && (s.p2 === 0 || s.p2 === null);
            return p1Issue || p2Issue;
        });

        if (studentsWithIssues.length > 0) {
            setWarning(`Dikkat: Seçilen sınıflarda ${studentsWithIssues.length} öğrencinin, dağıtılması istenen (P1 veya P2) notu girilmemiş (0 veya boş).`);
        }

        const firstStudent = allStudents[0];
        setParsedData(
            {
                lessonName: firstStudent.lessonName || 'Ders',
                className: `${selectedIndices.length} Sınıf / ${allStudents.length} Öğrenci`
            },
            allStudents
        );
    };

    if (step !== 1) return null;

    // Selection Mode UI
    if (isSelectionMode) {
        return (
            <Card className="w-full max-w-2xl mx-auto mt-10">
                <CardHeader>
                    <CardTitle>Sınıf ve Not Tipi Seçimi</CardTitle>
                    <CardDescription>
                        Hangi sınıflar ve hangi not türleri (P1/P2) için dağıtım yapılacağını seçin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
                        {parsedGroups.map((group, idx) => {
                            const state = selectionState[idx] || { selected: false, p1: false, p2: false };
                            return (
                                <div key={idx}
                                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${state.selected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                                    onClick={() => toggleGroupSelection(idx)}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${state.selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                            {state.selected && <span className="text-xs">✓</span>}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{group.metadata.className} - {group.metadata.lessonName}</p>
                                            <p className="text-xs text-muted-foreground">{group.students.length} Öğrenci</p>
                                        </div>
                                    </div>

                                    {/* P1 / P2 Checkboxes */}
                                    <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${state.p1 ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'}`}
                                                onClick={(e) => { if (state.selected) toggleP1(idx, e); }}
                                            >
                                                {state.p1 && <span className="text-xs">✓</span>}
                                            </div>
                                            <span className={`text-sm font-medium ${!state.selected ? 'text-gray-400' : ''}`}>P1</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${state.p2 ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'}`}
                                                onClick={(e) => { if (state.selected) toggleP2(idx, e); }}
                                            >
                                                {state.p2 && <span className="text-xs">✓</span>}
                                            </div>
                                            <span className={`text-sm font-medium ${!state.selected ? 'text-gray-400' : ''}`}>P2</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => { setIsSelectionMode(false); setParsedGroups([]); }}>İptal / Yeni Yükle</Button>
                        <Button onClick={handleConfirmSelection} disabled={Object.values(selectionState).filter(s => s.selected).length === 0}>
                            Seçilenleri Onayla ({Object.values(selectionState).filter(s => s.selected).length})
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Default Upload UI
    return (
        <Card className="w-full max-w-2xl mx-auto mt-10">
            <CardHeader>
                <CardTitle>e-Okul PDF Yükle</CardTitle>
                <CardDescription>
                    e-Okul sisteminden indirdiğiniz "Puan Çizelgesi" PDF dosyasını buraya yükleyin.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">



                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="file" className="text-lg font-semibold mb-2">
                        PDF Dosyası
                    </Label>
                    <div className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors relative cursor-pointer hover:bg-muted/50`}>
                        <Input
                            id="file"
                            type="file"
                            accept=".pdf"
                            className="w-full h-full opacity-0 absolute z-10 cursor-pointer"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            {loading ? (
                                <Loader2 className="h-10 w-10 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="h-10 w-10" />
                            )}
                            <span className="text-sm font-medium">
                                {loading ? (progressText || "Yapay Zeka PDF'i Analiz Ediyor...") : "PDF dosyasını buraya sürükleyin"}
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Hata</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {warning && (
                    <Alert className="border-yellow-500 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-800">Uyarı</AlertTitle>
                        <AlertDescription className="text-yellow-700">{warning}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
