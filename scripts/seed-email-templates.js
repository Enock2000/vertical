// Firebase Email Templates Seed Script
// Run this script to create the email templates in Firebase
// Usage: Copy/paste the JSON below into Firebase Console → Realtime Database → Import JSON

const emailTemplates = {
    "platformSettings": {
        "emailTemplates": {
            "welcomePending": {
                "subject": "Welcome to VerticalSync - Registration Under Review",
                "htmlContent": "<!DOCTYPE html><html><head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }.header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }.content { padding: 30px; background: #f9fafb; }.footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }</style></head><body><div class='header'><h1>Welcome to VerticalSync!</h1></div><div class='content'><p>Hi {{contactName}},</p><p>Thank you for registering <strong>{{companyName}}</strong> on VerticalSync. We're excited to have you on board!</p><p>Your account is currently under review by our team. This process typically takes 1-2 business days.</p><p>You'll receive an email once your account has been approved and is ready to use.</p><p>Best regards,<br>The VerticalSync Team</p></div><div class='footer'>© 2026 VerticalSync. All rights reserved.</div></body></html>"
            },
            "companyApproved": {
                "subject": "🎉 {{companyName}} Approved - Welcome to VerticalSync!",
                "htmlContent": "<!DOCTYPE html><html><head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }.header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }.content { padding: 30px; background: #f9fafb; }.footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }.button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }</style></head><body><div class='header'><h1>🎉 Congratulations!</h1></div><div class='content'><p>Hi {{contactName}},</p><p>Great news! Your company <strong>{{companyName}}</strong> has been approved on VerticalSync.</p><p>You now have full access to all platform features including Employee Management, Payroll Processing, Attendance Tracking, and Recruitment Tools.</p><a href='https://verticalsync.oizm.app/login' class='button'>Log In to Your Dashboard</a><p>Welcome aboard!<br>The VerticalSync Team</p></div><div class='footer'>© 2026 VerticalSync. All rights reserved.</div></body></html>"
            },
            "companySuspended": {
                "subject": "Important: {{companyName}} Account Suspended",
                "htmlContent": "<!DOCTYPE html><html><head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }.header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }.content { padding: 30px; background: #f9fafb; }.footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }</style></head><body><div class='header'><h1>Account Suspended</h1></div><div class='content'><p>Hi {{contactName}},</p><p>We regret to inform you that your company account <strong>{{companyName}}</strong> has been suspended on VerticalSync.</p><p>Please contact our support team at support@verticalsync.com to resolve this issue.</p><p>Regards,<br>The VerticalSync Team</p></div><div class='footer'>© 2026 VerticalSync. All rights reserved.</div></body></html>"
            },
            "newEmployeeWelcome": {
                "subject": "Welcome to {{companyName}} - Your VerticalSync Account",
                "htmlContent": "<!DOCTYPE html><html><head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }.header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }.content { padding: 30px; background: #f9fafb; }.footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }.button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }</style></head><body><div class='header'><h1>Welcome to the Team!</h1></div><div class='content'><p>Hi {{employeeName}},</p><p>Welcome to <strong>{{companyName}}</strong>! Your employee account has been created on VerticalSync.</p><p>With your employee portal, you can clock in/out, view payslips, request leave, and access company announcements.</p><a href='https://verticalsync.oizm.app/employee-login' class='button'>Log In to Employee Portal</a><p>Use the email and password provided by your HR administrator to log in.</p><p>Welcome aboard!<br>The {{companyName}} HR Team</p></div><div class='footer'>Powered by VerticalSync © 2026</div></body></html>"
            }
        }
    }
};

// JSON for Firebase Import (copy this):
console.log(JSON.stringify(emailTemplates, null, 2));
