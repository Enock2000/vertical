// src/lib/email.ts
import { sendEmail } from '@/ai/flows/send-email-flow';
import type { Company, Employee } from './data';
import { db } from './firebase';
import { ref, get } from 'firebase/database';

type TemplateName = 'welcomePending' | 'companyApproved' | 'companySuspended' | 'newEmployeeWelcome';

async function sendTemplatedEmail(templateName: TemplateName, to: { email: string; name: string }[], params: Record<string, string | number>) {
    const templateRef = ref(db, `platformSettings/emailTemplates/${templateName}`);
    const templateSnap = await get(templateRef);
    if (!templateSnap.exists()) {
        // Template not configured - silently skip email sending
        console.warn(`Email template "${templateName}" not configured. Skipping email.`);
        return null;
    }
    const template = templateSnap.val();

    let htmlContent = template.htmlContent;
    for (const key in params) {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), String(params[key]));
    }

    return sendEmail({
        to,
        subject: template.subject,
        htmlContent,
    });
}


export const sendWelcomePendingEmail = (company: Company) => {
    return sendTemplatedEmail('welcomePending',
        [{ email: company.adminEmail, name: company.contactName }],
        { companyName: company.name, contactName: company.contactName }
    );
};

export const sendCompanyApprovedEmail = (company: Company) => {
    return sendTemplatedEmail('companyApproved',
        [{ email: company.adminEmail, name: company.contactName }],
        { companyName: company.name, contactName: company.contactName }
    );
};

export const sendCompanySuspendedEmail = (company: Company) => {
    return sendTemplatedEmail('companySuspended',
        [{ email: company.adminEmail, name: company.contactName }],
        { companyName: company.name, contactName: company.contactName }
    );
};

export const sendNewEmployeeWelcomeEmail = (employee: Employee, companyName: string) => {
    return sendTemplatedEmail('newEmployeeWelcome',
        [{ email: employee.email, name: employee.name }],
        { employeeName: employee.name, companyName: companyName }
    );
};
