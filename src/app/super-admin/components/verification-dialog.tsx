'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, ExternalLink, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import type { Company, VerificationDocument, VerificationDocumentType } from '@/lib/data';
import { verificationDocuments } from '@/lib/data';

interface VerificationDialogProps {
    company: Company | null;
    open: boolean;
    onClose: () => void;
}

export function VerificationDialog({ company, open, onClose }: VerificationDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

    if (!company) return null;

    const documents = company.verification?.documents || {};
    const progress = company.verification?.progress || 0;

    const handleApprove = async (docType: VerificationDocumentType) => {
        setLoading(docType);
        try {
            const docRef = ref(db, `companies/${company.id}/verification/documents/${docType}`);
            await update(docRef, {
                status: 'Approved',
                reviewedAt: new Date().toISOString(),
                reviewedBy: 'Super Admin',
                rejectionReason: null,
            });

            // Calculate new progress
            const updatedDocs = { ...documents };
            updatedDocs[docType] = { ...updatedDocs[docType], status: 'Approved' };

            let newProgress = 0;
            Object.values(updatedDocs).forEach((doc) => {
                if (doc.status === 'Approved') {
                    const docConfig = verificationDocuments.find(d => d.type === doc.type);
                    if (docConfig) newProgress += docConfig.weight;
                }
            });

            // Check if all documents are approved
            const allApproved = verificationDocuments.every(
                d => updatedDocs[d.type]?.status === 'Approved'
            );

            await update(ref(db, `companies/${company.id}/verification`), {
                progress: newProgress,
                status: allApproved ? 'Verified' : 'In Progress',
                verifiedAt: allApproved ? new Date().toISOString() : null,
            });

            toast({
                title: 'Document Approved',
                description: allApproved
                    ? 'All documents verified. Company is now fully verified!'
                    : 'Document has been approved.',
            });
        } catch (error) {
            console.error('Error approving:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to approve document.',
            });
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async (docType: VerificationDocumentType) => {
        if (!rejectionReason.trim()) {
            toast({
                variant: 'destructive',
                title: 'Reason Required',
                description: 'Please provide a rejection reason.',
            });
            return;
        }

        setLoading(docType);
        try {
            const docRef = ref(db, `companies/${company.id}/verification/documents/${docType}`);
            await update(docRef, {
                status: 'Rejected',
                reviewedAt: new Date().toISOString(),
                reviewedBy: 'Super Admin',
                rejectionReason: rejectionReason.trim(),
            });

            await update(ref(db, `companies/${company.id}/verification`), {
                status: 'In Progress',
            });

            toast({
                title: 'Document Rejected',
                description: 'Company will be notified to re-upload.',
            });

            setShowRejectInput(null);
            setRejectionReason('');
        } catch (error) {
            console.error('Error rejecting:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to reject document.',
            });
        } finally {
            setLoading(null);
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'Approved':
                return <Badge className="bg-green-500">Approved</Badge>;
            case 'Rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            case 'Pending':
                return <Badge variant="secondary">Pending</Badge>;
            default:
                return <Badge variant="outline">Not Uploaded</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Verification Review - {company.name}</DialogTitle>
                    <DialogDescription>
                        Review and approve/reject company verification documents.
                    </DialogDescription>
                </DialogHeader>

                {/* Progress */}
                <div className="space-y-2 py-4">
                    <div className="flex justify-between text-sm">
                        <span>Verification Progress</span>
                        <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Documents List */}
                <div className="space-y-4">
                    {verificationDocuments.map((docConfig) => {
                        const doc = documents[docConfig.type];

                        return (
                            <div key={docConfig.type} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{docConfig.label}</p>
                                            <p className="text-xs text-muted-foreground">{docConfig.description}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(doc?.status)}
                                </div>

                                {doc ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Uploaded:</span>
                                            <span>{doc.name}</span>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                View <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>

                                        {doc.status === 'Rejected' && doc.rejectionReason && (
                                            <p className="text-sm text-destructive">
                                                Rejection reason: {doc.rejectionReason}
                                            </p>
                                        )}

                                        {doc.status === 'Pending' && (
                                            <div className="flex gap-2">
                                                {showRejectInput === docConfig.type ? (
                                                    <div className="flex-1 space-y-2">
                                                        <Label>Rejection Reason</Label>
                                                        <Textarea
                                                            placeholder="Enter reason for rejection..."
                                                            value={rejectionReason}
                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleReject(docConfig.type)}
                                                                disabled={loading === docConfig.type}
                                                            >
                                                                {loading === docConfig.type ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    'Confirm Reject'
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setShowRejectInput(null);
                                                                    setRejectionReason('');
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(docConfig.type)}
                                                            disabled={loading === docConfig.type}
                                                        >
                                                            {loading === docConfig.type ? (
                                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                            )}
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowRejectInput(docConfig.type)}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-2" />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Document not yet uploaded by company.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
