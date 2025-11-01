
'use server';

/**
 * @fileOverview Handles the submission of daily sales reports from branch employees.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { getAdminUserIds, createNotification, type SalesDailyReport } from '@/lib/data';

const SalesReportTransactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  paymentMethod: z.enum(['Cash', 'Card', 'Transfer', 'Other']),
});

const SubmitSalesReportInputSchema = z.object({
  companyId: z.string(),
  branchId: z.string(),
  branchName: z.string(),
  reportDate: z.string(), // ISO String
  transactions: z.array(SalesReportTransactionSchema).min(1, "At least one transaction is required."),
  submittedByEmployeeId: z.string(),
  submittedByEmployeeName: z.string(),
});

const SubmitSalesReportOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function submitSalesReport(
  input: z.infer<typeof SubmitSalesReportInputSchema>
): Promise<z.infer<typeof SubmitSalesReportOutputSchema>> {
  return submitSalesReportFlow(input);
}

const submitSalesReportFlow = ai.defineFlow(
  {
    name: 'submitSalesReportFlow',
    inputSchema: SubmitSalesReportInputSchema,
    outputSchema: SubmitSalesReportOutputSchema,
  },
  async (reportData) => {
    try {
      const reportDate = new Date(reportData.reportDate).toISOString().split('T')[0];
      const reportsRef = ref(db, `companies/${reportData.companyId}/salesReports`);
      const newReportRef = push(reportsRef);

      const totalSales = reportData.transactions.reduce((sum, tx) => sum + tx.amount, 0);

      const newReport: Omit<SalesDailyReport, 'id'> = {
        ...reportData,
        reportDate: reportDate,
        totalSales: totalSales,
        createdAt: new Date().toISOString(),
      };

      await set(newReportRef, { ...newReport, id: newReportRef.key });

      // Notify finance managers
      const adminIds = await getAdminUserIds(reportData.companyId);
      for (const adminId of adminIds) {
        await createNotification(reportData.companyId, {
          userId: adminId,
          title: 'New Sales Report Submitted',
          message: `${reportData.branchName} submitted a sales report for ${reportDate}. Total: ${totalSales.toFixed(2)}`,
          link: '/dashboard/finance?tab=sales-reports',
        });
      }

      return { success: true, message: 'Sales report submitted successfully.' };
    } catch (error: any) {
      console.error('Error submitting sales report:', error);
      return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
