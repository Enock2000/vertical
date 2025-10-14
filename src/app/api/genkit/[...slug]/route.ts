// src/app/api/genkit/[...slug]/route.ts
import { genkit } from '@genkit-ai/next';
import '@/ai/dev.ts';

export const { GET, POST, OPTIONS } = genkit();
