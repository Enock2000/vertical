// src/app/api/genkit/[...slug]/route.ts
import { createApi } from '@genkit-ai/next';
import '@/ai/dev';

export const { GET, POST, OPTIONS } = createApi();
