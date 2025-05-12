export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export interface SendEmailResult {
    success?: boolean;
    error?: any;
}