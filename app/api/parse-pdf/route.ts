import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const GeminiModelSchema = z.enum([
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
]);

const RequestSchema = z.object({
    file: z.string(), // Base64 encoded PDF
    apiKey: z.string(),
    geminiModel: GeminiModelSchema.optional().default('gemini-3-flash-preview'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { file, apiKey, geminiModel } = RequestSchema.parse(body);

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key Missing' }, { status: 401 });
        }

        const google = createGoogleGenerativeAI({
            apiKey: apiKey,
        });

        // Extract raw base64 data if it has a prefix
        const base64Data = file.split(',')[1] || file;

        const prompt = `
      You are an expert data extraction assistant. 
      Attached is a "Puan Çizelgesi" (Score Sheet) PDF which contains MULTIPLE PAGES (each page is usually a different class).
      
      Your task is to extract data for **ALL DISTINCT CLASSES** found in the file.
      
      For EACH class/page, extract:
      
      1. METADATA (Look at the top header of the page):
         - School Name (e.g. "KOCAELİ / GÖLCÜK / ...")
         - Academic Year (e.g. "2025-2026")
         - Class Name (e.g. "9. Sınıf / G Şubesi")
         - Lesson Name (e.g. "KİMYA")
         
      2. STUDENTS LIST:
         - Student Number
         - Student Name
         - P1 (First Performance Grade)
         - P2 (Second Performance Grade)
         
      IMPORTANT RULES:
      - Scan ALL pages. Do not stop after the first class.
      - IGNORE Written Exam grades (Y1, Y2, ...).
      - If a P1 or P2 cell contains "G", is empty, or is non-numeric, YOU MUST RETURN 0.
      - Return the data strictly in the specified JSON schema (list of classes).
    `;

        const result = await generateObject({
            model: google(geminiModel),
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image',
                            image: Buffer.from(base64Data, 'base64'),
                            // @ts-expect-error - Runtime Zod schema requires mimeType, though TS definition might miss it
                            mimeType: 'application/pdf'
                        }
                    ]
                }
            ],
            schema: z.object({
                classes: z.array(z.object({
                    metadata: z.object({
                        schoolName: z.string().describe("School Name from header"),
                        academicYear: z.string().describe("Academic Year e.g. 2025-2026"),
                        className: z.string(),
                        lessonName: z.string()
                    }),
                    students: z.array(z.object({
                        studentNo: z.string(),
                        name: z.string(),
                        p1: z.number().describe("First Performance Grade (0 if G or empty)"),
                        p2: z.number().describe("Second Performance Grade (0 if G or empty)")
                    }))
                })).describe("List of all classes/pages found in the PDF")
            })
        });

        return NextResponse.json(result.object);

    } catch (error: any) {
        console.error("PDF Parsing Error:", error);
        return NextResponse.json({ error: error.message || 'Error processing PDF' }, { status: 500 });
    }
}
