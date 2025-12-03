// src/types/lenco.d.ts
// TypeScript declarations for Lenco Pay SDK

interface LencoPayOptions {
    key: string;
    amount: number;
    currency: string;
    reference: string;
    email: string;
    customer?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
    };
    channels?: Array<'card' | 'mobile-money' | 'bank-account'>;
    onSuccess: (response: { reference: string;[key: string]: any }) => void | Promise<void>;
    onClose?: () => void;
}

interface LencoPayClass {
    getPaid(options: LencoPayOptions): void;
}

interface Window {
    LencoPayClass?: new () => LencoPayClass;
    LencoPay?: LencoPayClass;
}
