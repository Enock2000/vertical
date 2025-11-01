// src/ai/flows/upload-sales-report-flow.ts
'use server';

/**
 * @fileOverview Handles uploading a sales report file and creating a record.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set, serverTimestamp } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAdminUserIds, createNotification, type SalesDailyReport } from '@/lib/data';
import { format } from 'date-fns';

const UploadSalesReportInputSchema = z.object({
  companyId: z.string(),
  branchId: z.string(),
  branchName: z.string(),
  reportDate: z.string(), // ISO String
  submittedByEmployeeId: z.string(),
  submittedByEmployeeName: z.string(),
});

const UploadSalesReportOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});


export async function uploadSalesReport(
  formData: FormData
): Promise<z.infer<typeof UploadSalesReportOutputSchema>> {
    const file = formData.get('reportFile') as File | null;
    if (!file) {
        return { success: false, message: 'No file provided.' };
    }
    
    const rawData = {
        companyId: formData.get('companyId') as string,
        branchId: formData.get('branchId') as string,
        branchName: formData.get('branchName') as string,
        reportDate: formData.get('reportDate') as string,
        submittedByEmployeeId: formData.get('submittedByEmployeeId') as string,
        submittedByEmployeeName: formData.get('submittedByEmployeeName') as string,
    }

    const validatedFields = UploadSalesReportInputSchema.safeParse(rawData);
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid form data.' };
    }
    
    return uploadSalesReportFlow({ ...validatedFields.data, reportFile: file });
}

const uploadSalesReportFlow = ai.defineFlow(
  {
    name: 'uploadSalesReportFlow',
    inputSchema: UploadSalesReportInputSchema.extend({ reportFile: z.any() }),
    outputSchema: UploadSalesReportOutputSchema,
  },
  async ({ reportFile, ...reportData }) => {
    try {
      const reportDate = new Date(reportData.reportDate).toISOString().split('T')[0];
      
      // 1. Upload file to Firebase Storage
      const fileRefPath = `sales-reports/${reportData.companyId}/${reportDate}-${reportFile.name}`;
      const fileRef = storageRef(storage, fileRefPath);
      const snapshot = await uploadBytes(fileRef, reportFile);
      const fileUrl = await getDownloadURL(snapshot.ref);

      // 2. Create a new record in the database
      const reportsRef = dbRef(db, `companies/${reportData.companyId}/salesReports`);
      const newReportRef = push(reportsRef);

      const newReport: Partial<SalesDailyReport> = {
        ...reportData,
        reportDate: reportDate,
        totalSales: 0, // No transaction data for file uploads
        transactions: [], // Empty for file uploads
        createdAt: new Date().toISOString(),
        fileUrl: fileUrl,
        isFileUpload: true,
      };

      await set(newReportRef, { ...newReport, id: newReportRef.key });

      // 3. Notify finance managers
      const adminIds = await getAdminUserIds(reportData.companyId);
      for (const adminId of adminIds) {
        await createNotification(reportData.companyId, {
          userId: adminId,
          title: 'New Sales Report File Uploaded',
          message: `${reportData.branchName} uploaded a sales report file for ${reportDate}.`,
          link: '/dashboard/finance?tab=sales-reports',
        });
      }

      return { success: true, message: 'Sales report file uploaded successfully.' };
    } catch (error: any) {
      console.error('Error uploading sales report file:', error);
      return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
