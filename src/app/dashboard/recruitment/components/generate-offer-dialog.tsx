// src/app/dashboard/recruitment/components/generate-offer-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Send } from 'lucide-react';
import type { Applicant, Department, JobVacancy } from '@/lib/data';
import { generateOfferLetter } from '@/ai/flows/generate-offer-letter';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

interface GenerateOfferDialogProps {
  children: React.ReactNode;
  applicant: Applicant;
  vacancy: JobVacancy;
  department: Department;
}

export function GenerateOfferDialog({
  children,
  applicant,
  vacancy,
  department,
}: GenerateOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [offerLetter, setOfferLetter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const generateLetter = async () => {
        setIsLoading(true);
        try {
          const result = await generateOfferLetter({
            applicantName: applicant.name,
            jobTitle: vacancy.title,
            companyName: 'VerticalSync Inc.', // You can make this dynamic later
            salary: department.minSalary, // Using min salary as a placeholder
            startDate: new Date(new Date().setDate(new Date().getDate() + 14)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          });
          setOfferLetter(result.offerLetterText);
        } catch (error) {
          console.error('Error generating offer letter:', error);
          toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'Could not generate the offer letter.',
          });
          setOpen(false); // Close dialog on error
        } finally {
          setIsLoading(false);
        }
      };
      generateLetter();
    }
  }, [open, applicant, vacancy, department, toast]);

  const handleSendOffer = async () => {
    setIsSending(true);
    try {
        // Here you would integrate with an email service to send the offer.
        // For now, we will simulate it by updating the applicant's status.
        await update(ref(db, `applicants/${applicant.id}`), { status: 'Onboarding' });
        toast({
            title: 'Offer Sent!',
            description: `${applicant.name} has been moved to the Onboarding stage.`,
        });
        setOpen(false);
    } catch (error) {
        console.error('Error sending offer:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Send Offer',
            description: 'An unexpected error occurred.',
        });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI-Generated Offer Letter
          </DialogTitle>
          <DialogDescription>
            Review the generated offer letter for {applicant.name}. You can edit it before sending.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <Textarea
            value={offerLetter}
            onChange={(e) => setOfferLetter(e.target.value)}
            rows={15}
            className="my-4"
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSendOffer} disabled={isLoading || isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Offer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
