// src/app/api/genkit/[...slug]/route.ts
import { genkit } from '@genkit-ai/next';
import '@/ai/dev';

export const { GET, POST, OPTIONS } = genkit();
