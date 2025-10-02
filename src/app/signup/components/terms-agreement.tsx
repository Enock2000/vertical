
'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsAgreementFormProps {
  onAgreementChange: (agreed: boolean) => void;
}

const contractText = `
Last Updated: ${new Date().toLocaleDateString()}

This Software as a Service (SaaS) Agreement ("Agreement") is a binding legal agreement between you and VerticalSync ("Company"), governing your use of the VerticalSync HR Platform ("Service").

1. Acceptance of Terms
By checking the "I Agree" box and creating an account, you represent that you have the authority to bind your company to these terms and that you agree to be bound by this Agreement.

2. Description of Service
The Service provides a comprehensive HR platform including, but not limited to, payroll processing, employee management, recruitment, compliance assistance, and reporting tools.

3. Subscription and Payment
You agree to pay all applicable fees for the subscription plan you select. Fees are billed in advance on a monthly or annual basis and are non-refundable.

4. User Responsibilities
You are responsible for all activities that occur under your account. You agree to maintain the confidentiality of your account password and to notify the Company immediately of any unauthorized use.

5. Data Privacy
The Company will handle all data you provide in accordance with its Privacy Policy. You grant the Company a license to use, process, and transmit your data as necessary to provide the Service.

6. Intellectual Property
The Service and its original content, features, and functionality are and will remain the exclusive property of the Company and its licensors.

7. Termination
This Agreement may be terminated by either party. Upon termination, your right to use the Service will immediately cease.

8. Limitation of Liability
In no event shall the Company be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.

9. Governing Law
This Agreement shall be governed by the laws of the Republic of Zambia, without regard to its conflict of law provisions.
`;

export function TermsAgreementForm({ onAgreementChange }: TermsAgreementFormProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 2) {
      setHasScrolled(true);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    onAgreementChange(checked);
  }

  return (
    <div className="space-y-2">
        <Label>Terms of Service</Label>
        <ScrollArea onScroll={handleScroll} className="h-32 w-full rounded-md border p-3 text-xs text-muted-foreground bg-muted/50">
            {contractText.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
        </ScrollArea>
        <div className="flex items-center space-x-2">
            <Checkbox 
                id="terms" 
                disabled={!hasScrolled} 
                onCheckedChange={handleCheckboxChange}
                checked={isChecked}
            />
            <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
                I have read and agree to the terms and conditions
            </label>
        </div>
    </div>
  );
}
