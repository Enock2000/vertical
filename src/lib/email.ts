
import * as Brevo from '@getbrevo/brevo';
import type { Company, Employee } from './data';

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, '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');

const SENDER_EMAIL = "no-reply@verticalsync.com";
const SENDER_NAME = "VerticalSync";

interface EmailParams {
    [key: string]: string | number;
}

const sendTransactionalEmail = async (
    templateId: number,
    to: { email: string; name: string },
    params: EmailParams
) => {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.templateId = templateId;
    sendSmtpEmail.to = [to];
    sendSmtpEmail.params = params;
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Email sent successfully to ${to.email} using template ${templateId}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // In a real app, you might want to throw the error or handle it more gracefully
    }
};

export const sendWelcomePendingEmail = (company: Company) => {
    return sendTransactionalEmail(
        1, // Assumes Brevo template ID 1
        { email: company.adminEmail, name: company.contactName },
        {
            companyName: company.name,
            contactName: company.contactName,
        }
    );
};

export const sendCompanyApprovedEmail = (company: Company) => {
    return sendTransactionalEmail(
        2, // Assumes Brevo template ID 2
        { email: company.adminEmail, name: company.contactName },
        {
            companyName: company.name,
            contactName: company.contactName,
        }
    );
};

export const sendNewEmployeeWelcomeEmail = (employee: Employee, companyName: string) => {
    return sendTransactionalEmail(
        3, // Assumes Brevo template ID 3
        { email: employee.email, name: employee.name },
        {
            employeeName: employee.name,
            companyName: companyName,
        }
    );
};
