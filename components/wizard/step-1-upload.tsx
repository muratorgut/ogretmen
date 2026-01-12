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
    const { setFile, setParsedData, step, setApiKey: setStoreApiKey, setGeminiModel: setStoreGeminiModel, geminiModel: storeGeminiModel, apiKey: storeApiKey } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState(storeApiKey || '');
    const [geminiModel, setGeminiModel] = useState<GeminiModel>(storeGeminiModel || 'gemini-3-flash-preview');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!apiKey) {
            setError("Lütfen önce API Anahtarınızı giriniz.");
            return;
        }

        // Save to global store
        setStoreApiKey(apiKey);
        setStoreGeminiModel(geminiModel);

        setLoading(true);
        setError(null);

        try {
            setFile(file);

            // Convert to Base64
            const base64Promise = new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
            const base64File = await base64Promise;

            // Call API
            const response = await fetch('/api/parse-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: base64File, apiKey, geminiModel })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'PDF Okunurken hata oluştu.');
            }

            const data = await response.json();



            if (!data.classes || data.classes.length === 0) {
                throw new Error("PDF'den sınıf veya öğrenci verisi okunamadı.");
            }

            const allStudents: any[] = [];

            // Flatten all classes
            data.classes.forEach((cls: any) => {
                const classStudents = cls.students.map((s: any) => ({
                    id: s.studentNo,
                    name: s.name,
                    y1: 0,
                    y2: 0,
                    p1: s.p1,
                    p2: s.p2,
                    // Attach metadata to student
                    schoolName: cls.metadata.schoolName,
                    academicYear: cls.metadata.academicYear,
                    className: cls.metadata.className,
                    lessonName: cls.metadata.lessonName
                }));
                allStudents.push(...classStudents);
            });

            if (allStudents.length === 0) {
                throw new Error("Öğrenci listesi boş.");
            }

            // Check for G/0/empty values and warn user
            const studentsWithZeroOrEmpty = allStudents.filter(s =>
                s.p1 === 0 || s.p2 === 0 || s.p1 === null || s.p2 === null
            );
            if (studentsWithZeroOrEmpty.length > 0) {
                setWarning(`Dikkat: ${studentsWithZeroOrEmpty.length} öğrencide P1 veya P2 notu 0, "G" veya boş olarak tespit edildi. Bu öğrenciler için dağıtım yapılmayacaktır.`);
            } else {
                setWarning(null);
            }

            // Use the first class metadata for the main App Context header summary
            const firstMeta = data.classes[0].metadata;

            setParsedData(
                {
                    lessonName: firstMeta.lessonName || 'Ders',
                    className: `${data.classes.length} Sınıf / Toplam ${allStudents.length} Öğrenci` // Show summary in header
                },
                allStudents
            );

        } catch (err: any) {
            setError(err.message || "Dosya okunurken bir hata oluştu.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (step !== 1) return null;

    return (
        <Card className="w-full max-w-2xl mx-auto mt-10">
            <CardHeader>
                <CardTitle>e-Okul PDF Yükle</CardTitle>
                <CardDescription>
                    e-Okul sisteminden indirdiğiniz "Puan Çizelgesi" PDF dosyasını buraya yükleyin.
                    Gemini modelini seçin ve API Anahtarınızı girin.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Gemini Model Selection */}
                <div className="space-y-2">
                    <Label>Google Gemini Model</Label>
                    <Select value={geminiModel} onValueChange={(v) => setGeminiModel(v as GeminiModel)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Model Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini-3-pro-preview">Gemini 3 Pro (Preview)</SelectItem>
                            <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash (Preview)</SelectItem>
                            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                            <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</SelectItem>
                            <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                            <SelectItem value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash-Lite</SelectItem>
                            <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="apiKey">Google Gemini API Key</Label>
                    <Input
                        id="apiKey"
                        type="password"
                        placeholder="AIzaSy..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">PDF analizi için gereklidir. (Kendi anahtarınızı giriniz)</p>
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="file" className="text-lg font-semibold mb-2">
                        PDF Dosyası
                    </Label>
                    <div className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors relative ${!apiKey ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-muted/50'}`}>
                        <Input
                            id="file"
                            type="file"
                            accept=".pdf"
                            className="w-full h-full opacity-0 absolute z-10 cursor-pointer"
                            onChange={handleFileChange}
                            disabled={loading || !apiKey}
                        />
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            {loading ? (
                                <Loader2 className="h-10 w-10 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="h-10 w-10" />
                            )}
                            <span className="text-sm font-medium">
                                {loading ? "Yapay Zeka PDF'i Analiz Ediyor..." : (apiKey ? "PDF dosyasını buraya sürükleyin" : "Önce API Key giriniz")}
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
