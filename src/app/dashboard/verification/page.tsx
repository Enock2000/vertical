'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Upload, CheckCircle, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, onValue, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/app/auth-provider';
import type { Company, VerificationDocument, VerificationDocumentType, CompanyVerification } from '@/lib/data';
import { verificationDocuments } from '@/lib/data';

export default function VerificationPage() {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        if (!companyId) return;

        const companyRef = dbRef(db, `companies/${companyId}`);
        const unsubscribe = onValue(companyRef, (snapshot) => {
            if (snapshot.exists()) {
                setCompany(snapshot.val());
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [companyId]);

    const calculateProgress = useCallback((verification?: CompanyVerification) => {
        if (!verification?.documents) return 0;

        let totalWeight = 0;
        verificationDocuments.forEach((doc) => {
            const uploadedDoc = verification.documents[doc.type];
            if (uploadedDoc?.status === 'Approved') {
                totalWeight += doc.weight;
            }
        });
        return totalWeight;
    }, []);

    const handleFileUpload = async (docType: VerificationDocumentType, file: File) => {
        if (!companyId) return;

        // Validate file
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

        if (file.size > maxSize) {
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: 'Maximum file size is 5MB.',
            });
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            toast({
                variant: 'destructive',
                title: 'Invalid File Type',
                description: 'Please upload a PDF, JPG, or PNG file.',
            });
            return;
        }

        setUploading(docType);

        try {
            // Upload to Firebase Storage
            const fileRef = storageRef(storage, `companies/${companyId}/verification/${docType}/${file.name}`);
            await uploadBytes(fileRef, file);
            const downloadUrl = await getDownloadURL(fileRef);

            // Update database
            const docData: VerificationDocument = {
                id: docType,
                type: docType,
                name: file.name,
                url: downloadUrl,
                uploadedAt: new Date().toISOString(),
                status: 'Pending',
            };

            const currentVerification = company?.verification || {
                status: 'In Progress',
                progress: 0,
                documents: {},
            };

            const updatedDocuments = {
                ...currentVerification.documents,
                [docType]: docData,
            };

            // Calculate new progress (pending docs count as 0%)
            const uploadedCount = Object.keys(updatedDocuments).length;
            const newStatus: CompanyVerification['status'] =
                uploadedCount === verificationDocuments.length ? 'Pending Review' : 'In Progress';

            await update(dbRef(db, `companies/${companyId}/verification`), {
                status: newStatus,
                progress: calculateProgress({ ...currentVerification, documents: updatedDocuments }),
                documents: updatedDocuments,
                submittedAt: uploadedCount === verificationDocuments.length ? new Date().toISOString() : currentVerification.submittedAt,
            });

            toast({
                title: 'Document Uploaded',
                description: 'Your document has been submitted for review.',
            });
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Could not upload document. Please try again.',
            });
        } finally {
            setUploading(null);
        }
    };

    const getDocumentStatus = (docType: VerificationDocumentType) => {
        const doc = company?.verification?.documents?.[docType];
        if (!doc) return 'not_uploaded';
        return doc.status.toLowerCase();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case 'pending':
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
            default:
                return <Badge variant="outline"><Upload className="w-3 h-3 mr-1" /> Not Uploaded</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const progress = company?.verification?.progress || 0;
    const verificationStatus = company?.verification?.status || 'Not Started';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Company Verification</h1>
                <p className="text-muted-foreground">
                    Complete your company verification by uploading the required documents.
                </p>
            </div>

            {/* Progress Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Verification Progress</span>
                        <Badge variant={verificationStatus === 'Verified' ? 'default' : 'secondary'}>
                            {verificationStatus}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        {progress === 100
                            ? 'All documents have been approved. Your company is fully verified!'
                            : 'Upload all required documents to complete verification.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                    </div>
                </CardContent>
            </Card>

            {/* Alert for rejected documents */}
            {Object.values(company?.verification?.documents || {}).some(d => d.status === 'Rejected') && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription>
                        Some documents have been rejected. Please review the feedback and re-upload.
                    </AlertDescription>
                </Alert>
            )}

            {/* Document Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {verificationDocuments.map((docConfig) => {
                    const status = getDocumentStatus(docConfig.type);
                    const uploadedDoc = company?.verification?.documents?.[docConfig.type];

                    return (
                        <Card key={docConfig.type} className={status === 'rejected' ? 'border-destructive' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <CardTitle className="text-base">{docConfig.label}</CardTitle>
                                    </div>
                                    {getStatusBadge(status)}
                                </div>
                                <CardDescription className="text-xs">
                                    {docConfig.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {uploadedDoc && (
                                        <div className="text-sm">
                                            <p className="text-muted-foreground truncate">
                                                📄 {uploadedDoc.name}
                                            </p>
                                            {uploadedDoc.status === 'Rejected' && uploadedDoc.rejectionReason && (
                                                <p className="text-destructive text-xs mt-1">
                                                    Reason: {uploadedDoc.rejectionReason}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {status !== 'approved' && (
                                        <div>
                                            <input
                                                type="file"
                                                id={`file-${docConfig.type}`}
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(docConfig.type, file);
                                                }}
                                                disabled={uploading === docConfig.type}
                                            />
                                            <Button
                                                variant={status === 'rejected' ? 'destructive' : 'outline'}
                                                size="sm"
                                                className="w-full"
                                                disabled={uploading === docConfig.type}
                                                onClick={() => document.getElementById(`file-${docConfig.type}`)?.click()}
                                            >
                                                {uploading === docConfig.type ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        {status === 'not_uploaded' ? 'Upload Document' : 'Re-upload'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    <div className="text-xs text-muted-foreground">
                                        Weight: {docConfig.weight}% • Max: 5MB • PDF, JPG, PNG
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
