"use client"

import React, { useState } from 'react';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Zap, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function Step3Processing() {
    const { step, setStep, students, config, meta, updateStudentScores, apiKey, geminiModel } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    if (step !== 3) return null;

    const handleProcess = async () => {
        setLoading(true);
        setError(null);
        setProgress(0);

        try {
            // Client-side batching to avoid Vercel Timeouts
            // We use a safe batch size (e.g. 20) to ensure each request finishes <10s
            const BATCH_SIZE = 20;
            const totalStudents = students.length;
            let processedCount = 0;

            for (let i = 0; i < totalStudents; i += BATCH_SIZE) {
                const chunk = students.slice(i, i + BATCH_SIZE);

                // Prepare chunk data
                const chunkPayload = chunk.map(s => ({
                    id: s.id,
                    name: s.name,
                    y1: s.y1,
                    y2: s.y2,
                    p1: s.p1,
                    p2: s.p2
                }));

                const response = await fetch('/api/distribute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        apiKey,
                        geminiModel,
                        lessonName: meta.lessonName,
                        className: meta.className,
                        roundingRule: config.roundingRule,
                        rubricsP1: config.rubricsP1,
                        rubricsP2: config.rubricsP2,
                        students: chunkPayload
                    }),
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || `Batch ${i / BATCH_SIZE + 1} başarısız oldu.`);
                }

                const data = await response.json();

                // Update Store immediately with this batch's results
                data.distributions.forEach((d: any) => {
                    const scores: Record<string, number> = {};
                    d.p1_scores.forEach((item: any) => scores[item.rubricId] = item.score);
                    d.p2_scores.forEach((item: any) => scores[item.rubricId] = item.score);

                    updateStudentScores(d.studentId, scores);
                });

                processedCount += chunk.length;
                setProgress(Math.round((processedCount / totalStudents) * 100));
            }

            // All batches done
            setStep(4);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "İşlem sırasında beklenmedik bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto mt-6">
            <CardHeader>
                <CardTitle>Yapay Zeka Dağıtımı</CardTitle>
                <CardDescription>
                    Seçilen model ({geminiModel}) kullanılarak {students.length} öğrencinin notları pedagojik tutarlılıkla dağıtılacak.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="font-bold text-blue-800">
                        {loading ? `İşleniyor: %${progress}` : "İşlemeye Hazır"}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        Uzun listeler parçalar halinde işlenir. Lütfen bekleyiniz.
                    </p>
                </div>

                {loading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Hata</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                </Button>
                <Button onClick={handleProcess} disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {progress}% Tamamlandı
                        </>
                    ) : (
                        <>
                            <Zap className="mr-2 h-4 w-4" /> Başlat
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
