import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Set timeout to 60s for long generation (though batching helps, total duration might be long)
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
    apiKey: z.string().optional(),
    geminiModel: GeminiModelSchema.optional().default('gemini-2.0-flash'),
    lessonName: z.string(),
    className: z.string(),
    roundingRule: z.number(),
    rubricsP1: z.array(z.object({
        id: z.string(),
        label: z.string(),
        maxScore: z.number(),
        description: z.string().optional()
    })),
    rubricsP2: z.array(z.object({
        id: z.string(),
        label: z.string(),
        maxScore: z.number(),
        description: z.string().optional()
    })),
    students: z.array(z.object({
        id: z.string(),
        name: z.string(),
        y1: z.number().optional(),
        y2: z.number().optional(),
        p1: z.number().optional(),
        p2: z.number().optional(),
        distributeP1: z.boolean().optional(),
        distributeP2: z.boolean().optional()
    }))
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { apiKey, geminiModel, lessonName, className, roundingRule, rubricsP1, rubricsP2, students } = RequestSchema.parse(body);

        const token = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!token) {
            return NextResponse.json({ error: 'API Key Missing' }, { status: 401 });
        }

        const google = createGoogleGenerativeAI({
            apiKey: token,
        });

        const BATCH_SIZE = 40;
        const studentChunks = [];
        for (let i = 0; i < students.length; i += BATCH_SIZE) {
            studentChunks.push(students.slice(i, i + BATCH_SIZE));
        }

        const distributions: any[] = [];
        let lastError: any = null;

        for (const chunk of studentChunks) {
            if (distributions.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const prompt = `
          You are an expert educational assistant specializing in grade distribution. 
          
          CRITICAL MISSION: 
          You are processing data for a SPECIFIC class and a SPECIFIC lesson. 
          - Class: ${className}
          - Lesson: ${lessonName} 
          
          Rounding Rule: Scores must be multiples of ${roundingRule}.
          
          RUBRIC P1 CONFIGURATION:
          ${rubricsP1.map((r, i) => `${i + 1}. ID: "${r.id}", Label: "${r.label}", Max: ${r.maxScore}`).join('\n')}
          
          RUBRIC P2 CONFIGURATION:
          ${rubricsP2.map((r, i) => `${i + 1}. ID: "${r.id}", Label: "${r.label}", Max: ${r.maxScore}`).join('\n')}
          
          STUDENTS DATA:
          ${JSON.stringify(chunk.map(s => {
                const processP1 = s.distributeP1 !== false;
                const processP2 = s.distributeP2 !== false;
                return {
                    id: s.id,
                    name: s.name,
                    WrittenExams: [s.y1, s.y2],
                    Targets: {
                        P1: processP1 ? s.p1 : null,
                        P2: processP2 ? s.p2 : null
                    },
                    ProcessP1: processP1,
                    ProcessP2: processP2
                };
            }), null, 2)}
          
          STRICT RULES:
          1. Check 'ProcessP1' and 'ProcessP2' flags for each student.
          2. IF ProcessP1 is TRUE: Provide a distribution for P1 where sum of rubrics equals Target P1.
          3. IF ProcessP1 is FALSE: Return an empty array [] for p1_scores.
          4. IF ProcessP2 is TRUE: Provide a distribution for P2 where sum of rubrics equals Target P2.
          5. IF ProcessP2 is FALSE: Return an empty array [] for p2_scores.
          6. No individual rubric score can exceed its Max Score.
          
          OUTPUT FORMAT:
          Return a JSON object with a 'distributions' array. Each item must contain 'studentId', 'p1_scores', and 'p2_scores'.
        `;

            try {
                const result = await generateObject({
                    model: google(geminiModel),
                    temperature: 0.7,
                    schema: z.object({
                        distributions: z.array(z.object({
                            studentId: z.string(),
                            p1_scores: z.array(z.object({ rubricId: z.string(), score: z.number() })),
                            p2_scores: z.array(z.object({ rubricId: z.string(), score: z.number() }))
                        }))
                    }),
                    prompt: prompt,
                });

                if (result.object && result.object.distributions) {
                    distributions.push(...result.object.distributions);
                }
            } catch (err: any) {
                console.error(`Batch Processing Error (Students ${chunk[0]?.id} - ${chunk[chunk.length - 1]?.id}):`, err);
                lastError = err;
                // We continue processing other batches even if one fails
            }
        }

        if (distributions.length === 0) {
            // Return the actual error to help debugging
            const errorMessage = lastError?.message || lastError?.toString() || 'Dağıtım işlemi başarısız oldu veya hiçbir veri üretilemedi.';
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json({ distributions });

    } catch (error: any) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: error.message || 'Error generating scores' }, { status: 500 });
    }
}
