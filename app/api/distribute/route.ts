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
    geminiModel: GeminiModelSchema.optional().default('gemini-3-flash-preview'),
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
        p1: z.number().optional(), // Target P1
        p2: z.number().optional()  // Target P2
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

        // Batch students to avoid output token limits and timeouts
        // 40 students per batch matches a typical class size and reduces RPM hits
        const BATCH_SIZE = 40;
        const studentChunks = [];
        for (let i = 0; i < students.length; i += BATCH_SIZE) {
            studentChunks.push(students.slice(i, i + BATCH_SIZE));
        }

        const distributions: any[] = [];
        let lastError: any = null;

        // Process batches sequentially to ensure stability
        for (const chunk of studentChunks) {
            // Add a small delay to avoid hitting rate limits (RPM)
            if (distributions.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const prompt = `
          You are an expert educational assistant.
          Your task is to distribute the Total Performance Grade (P1 and P2) for ${chunk.length} students into specific rubric criteria scores.
          
          Class: ${className}
          Lesson: ${lessonName}
          Rounding Rule: Quotes must be multiples of ${roundingRule}.
          
          RUBRIC P1 CONFIGURATION (${rubricsP1.length} criteria - YOU MUST PROVIDE SCORES FOR ALL ${rubricsP1.length} CRITERIA):
          ${rubricsP1.map((r, i) => `${i + 1}. ID: "${r.id}", Label: "${r.label}", Max: ${r.maxScore}`).join('\n')}
          
          RUBRIC P2 CONFIGURATION (${rubricsP2.length} criteria - YOU MUST PROVIDE SCORES FOR ALL ${rubricsP2.length} CRITERIA):
          ${rubricsP2.map((r, i) => `${i + 1}. ID: "${r.id}", Label: "${r.label}", Max: ${r.maxScore}`).join('\n')}
          
          STUDENTS DATA:
          ${JSON.stringify(chunk.map(s => ({
                id: s.id,
                name: s.name,
                WrittenExams: [s.y1, s.y2],
                Targets: { P1: s.p1, P2: s.p2 }
            })), null, 2)}
          
          CRITICAL RULES:
          1. COMPLETENESS: For EACH student, you MUST return scores for ALL ${rubricsP1.length} P1 rubrics (IDs: ${rubricsP1.map(r => r.id).join(', ')}) AND ALL ${rubricsP2.length} P2 rubrics (IDs: ${rubricsP2.map(r => r.id).join(', ')}). Missing rubric scores are NOT ALLOWED.
          2. Mathematical Precision: For each student, the sum of all P1 rubric scores MUST EXACTLY equal their Target P1. Same for P2.
          3. Rounding: Each individual rubric score must be a multiple of ${roundingRule} if possible.
          4. Diversity: Students with the same target grades MUST have different rubric breakdowns. Vary how points are distributed across ALL criteria.
          5. Constraints: No individual rubric score can exceed its Max Score. Minimum score is 0.
          
          IMPORTANT: Your p1_scores array MUST contain exactly ${rubricsP1.length} items. Your p2_scores array MUST contain exactly ${rubricsP2.length} items.
        `;

            try {
                // Use the selected Gemini model with higher temperature for variety
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
