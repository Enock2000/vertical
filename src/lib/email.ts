// src/lib/email.ts
import { sendEmail } from '@/ai/flows/send-email-flow';
import type { Company, Employee } from './data';
import { db } from './firebase';
import { ref, get } from 'firebase/database';

type TemplateName = 'welcomePending' | 'companyApproved' | 'companySuspended' | 'newEmployeeWelcome';

async function sendTemplatedEmail(templateName: TemplateName, to: { email: string; name: string }[], params: Record<string, string | number>) {
    try {
        console.log(`[Email] Attempting to send "${templateName}" email to:`, to.map(t => t.email).join(', '));

        const templateRef = ref(db, `platformSettings/emailTemplates/${templateName}`);
        const templateSnap = await get(templateRef);

        if (!templateSnap.exists()) {
            console.warn(`[Email] Template "${templateName}" not configured in Firebase. Skipping email.`);
            return null;
        }

        const template = templateSnap.val();
        console.log(`[Email] Template found. Subject: "${template.subject}"`);

        if (!template.htmlContent) {
            console.warn(`[Email] Template "${templateName}" has no htmlContent. Skipping email.`);
            return null;
        }

        let htmlContent = template.htmlContent;
        for (const key in params) {
            htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), String(params[key]));
        }

        // Also replace placeholders in subject
        let subject = template.subject;
        for (const key in params) {
            subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), String(params[key]));
        }

        const result = await sendEmail({
            to,
            subject,
            htmlContent,
        });

        console.log(`[Email] Send result for "${templateName}":`, result);
        return result;
    } catch (error) {
        console.error(`[Email] Error sending "${templateName}" email:`, error);
        return null;
    }
}


export const sendWelcomePendingEmail = (company: Company) => {
    const recipientEmail = company.adminEmail;
    const recipientName = company.contactName || company.name || 'Admin';

    if (!recipientEmail) {
        console.error('[Email] Cannot send welcome email - company.adminEmail is missing');
        return Promise.resolve(null);
    }

    return sendTemplatedEmail('welcomePending',
        [{ email: recipientEmail, name: recipientName }],
        { companyName: company.name || 'Your Company', contactName: recipientName }
    );
};

export const sendCompanyApprovedEmail = (company: Company) => {
    const recipientEmail = company.adminEmail;
    const recipientName = company.contactName || company.name || 'Admin';

    if (!recipientEmail) {
        console.error('[Email] Cannot send approval email - company.adminEmail is missing');
        return Promise.resolve(null);
    }

    return sendTemplatedEmail('companyApproved',
        [{ email: recipientEmail, name: recipientName }],
        { companyName: company.name || 'Your Company', contactName: recipientName }
    );
};

export const sendCompanySuspendedEmail = (company: Company) => {
    const recipientEmail = company.adminEmail;
    const recipientName = company.contactName || company.name || 'Admin';

    if (!recipientEmail) {
        console.error('[Email] Cannot send suspension email - company.adminEmail is missing');
        return Promise.resolve(null);
    }

    return sendTemplatedEmail('companySuspended',
        [{ email: recipientEmail, name: recipientName }],
        { companyName: company.name || 'Your Company', contactName: recipientName }
    );
};

export const sendNewEmployeeWelcomeEmail = (employee: Employee, companyName: string) => {
    const recipientEmail = employee.email;
    const recipientName = employee.name || 'New Employee';

    if (!recipientEmail) {
        console.error('[Email] Cannot send employee welcome email - employee.email is missing');
        return Promise.resolve(null);
    }

    return sendTemplatedEmail('newEmployeeWelcome',
        [{ email: recipientEmail, name: recipientName }],
        { employeeName: recipientName, companyName: companyName || 'Your Company' }
    );
};
