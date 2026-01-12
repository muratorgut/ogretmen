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

    if (step !== 3) return null;

    const handleProcess = async () => {
        setLoading(true);
        setError(null);

        try {
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
                    students: students.map(s => ({
                        id: s.id,
                        name: s.name,
                        y1: s.y1,
                        y2: s.y2,
                        p1: s.p1,
                        p2: s.p2
                    }))
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'İşlem başarısız oldu.');
            }

            const data = await response.json();

            // Update Store
            data.distributions.forEach((d: any) => {
                const scores: Record<string, number> = {};
                d.p1_scores.forEach((item: any) => scores[item.rubricId] = item.score);
                d.p2_scores.forEach((item: any) => scores[item.rubricId] = item.score);

                updateStudentScores(d.studentId, scores);
            });

            setStep(4);

        } catch (err: any) {
            setError(err.message);
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
                <p className="text-center text-red-600 font-bold text-lg uppercase">
                    DAĞITIM ÖĞRENCİ SAYISINA GÖRE 5 DAKİKA KADAR SÜREBİLİR!
                </p>

                {/* API Key input removed - Moved to Step 1 */}

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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Dağıtılıyor...
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
