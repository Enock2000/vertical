
import { sendEmail } from '@/ai/flows/send-email-flow';
import type { Company, Employee } from './data';

export const sendWelcomePendingEmail = (company: Company) => {
    return sendEmail({
        templateId: 1,
        to: { email: company.adminEmail, name: company.contactName },
        params: {
            companyName: company.name,
            contactName: company.contactName,
        }
    });
};

export const sendCompanyApprovedEmail = (company: Company) => {
     return sendEmail({
        templateId: 2,
        to: { email: company.adminEmail, name: company.contactName },
        params: {
            companyName: company.name,
            contactName: company.contactName,
        }
    });
};

export const sendNewEmployeeWelcomeEmail = (employee: Employee, companyName: string) => {
    return sendEmail({
        templateId: 3,
        to: { email: employee.email, name: employee.name },
        params: {
            employeeName: employee.name,
            companyName: companyName,
        }
    });
};
