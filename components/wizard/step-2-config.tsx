"use client"

import React, { useState } from 'react';
import { useAppStore, RubricItem } from './store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Step2Config() {
    const { step, setStep, config, updateConfig } = useAppStore();
    const [localConfig, setLocalConfig] = useState(config);

    if (step !== 2) return null;

    const handleNext = () => {
        // Validate that rubrics exist and sum logical?
        // Warn if sum != 100 but allow proceeding?
        // For now proceed
        updateConfig(localConfig);
        setStep(3);
    };

    const addRubricItem = (type: 'p1' | 'p2') => {
        const newItem: RubricItem = {
            id: crypto.randomUUID(),
            label: '',
            description: '',
            maxScore: 20
        };

        if (type === 'p1') {
            setLocalConfig({ ...localConfig, rubricsP1: [...localConfig.rubricsP1, newItem] });
        } else {
            setLocalConfig({ ...localConfig, rubricsP2: [...localConfig.rubricsP2, newItem] });
        }
    };

    const updateRubricItem = (type: 'p1' | 'p2', id: string, field: keyof RubricItem, value: any) => {
        const list = type === 'p1' ? localConfig.rubricsP1 : localConfig.rubricsP2;
        const newList = list.map(item => item.id === id ? { ...item, [field]: value } : item);

        if (type === 'p1') setLocalConfig({ ...localConfig, rubricsP1: newList });
        else setLocalConfig({ ...localConfig, rubricsP2: newList });
    };

    const removeRubricItem = (type: 'p1' | 'p2', id: string) => {
        const list = type === 'p1' ? localConfig.rubricsP1 : localConfig.rubricsP2;
        const newList = list.filter(item => item.id !== id);
        if (type === 'p1') setLocalConfig({ ...localConfig, rubricsP1: newList });
        else setLocalConfig({ ...localConfig, rubricsP2: newList });
    };

    const totalP1 = localConfig.rubricsP1.reduce((sum, item) => sum + Number(item.maxScore), 0);
    const totalP2 = localConfig.rubricsP2.reduce((sum, item) => sum + Number(item.maxScore), 0);

    return (
        <Card className="w-full max-w-4xl mx-auto mt-6">
            <CardHeader>
                <CardTitle>Değerlendirme Kriterleri (Rubrik)</CardTitle>
                <CardDescription>
                    Performans notlarını oluşturacak alt kriterleri belirleyin. Her bir performans türü için ayrı ayrı tanımlama yapın.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-1">
                        <Label>Yuvarlama Kuralı</Label>
                        <Select
                            value={String(localConfig.roundingRule)}
                            onValueChange={(v) => setLocalConfig({ ...localConfig, roundingRule: Number(v) as 1 | 5 | 10 })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1'lik (Tam Puan)</SelectItem>
                                <SelectItem value="5">5'in Katları</SelectItem>
                                <SelectItem value="10">10'un Katları</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Öğretmen ve Müdür Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-blue-50">
                    <div className="space-y-1">
                        <Label>Ders Öğretmeni Adı Soyadı</Label>
                        <Input
                            value={localConfig.teacherName}
                            onChange={(e) => setLocalConfig({ ...localConfig, teacherName: e.target.value })}
                            placeholder="Örn: Ahmet YILMAZ"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Öğretmen Branşı</Label>
                        <Input
                            value={localConfig.teacherBranch}
                            onChange={(e) => setLocalConfig({ ...localConfig, teacherBranch: e.target.value })}
                            placeholder="Örn: Kimya"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Okul Müdürü Adı Soyadı</Label>
                        <Input
                            value={localConfig.principalName}
                            onChange={(e) => setLocalConfig({ ...localConfig, principalName: e.target.value })}
                            placeholder="Örn: Mehmet DEMİR"
                        />
                    </div>
                </div>

                <Tabs defaultValue="p1" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="p1">P1 Ayarları ({localConfig.p1Name})</TabsTrigger>
                        <TabsTrigger value="p2">P2 Ayarları ({localConfig.p2Name})</TabsTrigger>
                    </TabsList>

                    <RubricTabContent
                        type="p1"
                        titleValue={localConfig.p1Name}
                        onTitleChange={(v) => setLocalConfig({ ...localConfig, p1Name: v })}
                        items={localConfig.rubricsP1}
                        currentTotal={totalP1}
                        onAdd={() => addRubricItem('p1')}
                        onUpdate={(id, f, v) => updateRubricItem('p1', id, f, v)}
                        onRemove={(id) => removeRubricItem('p1', id)}
                    />

                    <RubricTabContent
                        type="p2"
                        titleValue={localConfig.p2Name}
                        onTitleChange={(v) => setLocalConfig({ ...localConfig, p2Name: v })}
                        items={localConfig.rubricsP2}
                        currentTotal={totalP2}
                        onAdd={() => addRubricItem('p2')}
                        onUpdate={(id, f, v) => updateRubricItem('p2', id, f, v)}
                        onRemove={(id) => removeRubricItem('p2', id)}
                    />
                </Tabs>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                </Button>
                <Button onClick={handleNext}>
                    Devam Et <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

function RubricTabContent({ type, titleValue, onTitleChange, items, currentTotal, onAdd, onUpdate, onRemove }: any) {
    return (
        <TabsContent value={type} className="space-y-4 mt-4">
            <div className="grid gap-2">
                <Label>Sütun Başlığı (Örn: Derse Katılım)</Label>
                <Input value={titleValue} onChange={(e) => onTitleChange(e.target.value)} />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Kriterler</h3>
                    <div className={`text-sm font-bold ${currentTotal !== 100 ? 'text-orange-600' : 'text-green-600'}`}>
                        Toplam Puan: {currentTotal} / 100
                    </div>
                </div>

                <div className="space-y-4">
                    {items.map((item: RubricItem, idx: number) => (
                        <div key={item.id} className="flex gap-4 items-start p-3 bg-white rounded-md border shadow-sm">
                            <div className="flex items-center justify-center bg-gray-100 w-8 h-8 rounded-full mb-auto mt-2 font-bold text-gray-500">
                                {idx + 1}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <Label className="text-xs">Kriter Adı</Label>
                                        <Input
                                            value={item.label}
                                            onChange={(e) => onUpdate(item.id, 'label', e.target.value)}
                                            placeholder="Örn: Derse hazırlıklı gelme"
                                        />
                                    </div>
                                    <div className="w-full sm:w-24">
                                        <Label className="text-xs">Max Puan</Label>
                                        <Input
                                            type="number"
                                            value={item.maxScore}
                                            onChange={(e) => onUpdate(item.id, 'maxScore', Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-500 mt-2" onClick={() => onRemove(item.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <Button variant="outline" className="w-full mt-4 border-dashed" onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Kriter Ekle
                </Button>
            </div>
        </TabsContent>
    )
}
