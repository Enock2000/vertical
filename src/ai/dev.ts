import { config } from 'dotenv';
config();

import '@/ai/flows/compliance-recommendations.ts';
import '@/ai/flows/attendance-flow.ts';
import '@/ai/flows/process-daily-attendance.ts';
import '@/ai/flows/generate-offer-letter.ts';
import '@/ai/flows/run-payroll-flow.ts';
import '@/ai/flows/support-chat-flow.ts';
import '@/ai/flows/handle-application-flow.ts';
