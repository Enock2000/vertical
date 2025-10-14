// src/app/api/genkit/[...slug]/route.ts
import { genkit } from '@genkit-ai/next';
// All AI flow imports are managed by the genkit dev CLI
// import '@/ai/dev.ts';

export const { GET, POST, OPTIONS } = genkit();
