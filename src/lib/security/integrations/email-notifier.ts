// lib/security/integrations/email-notifier.ts
export class EmailNotifier {
    private apiKey: string;
    private enabled: boolean;
    private fromEmail: string;

    constructor() {
        this.apiKey = process.env.SENDGRID_API_KEY || '';
        this.fromEmail = process.env.SECURITY_FROM_EMAIL || 'security@company.com';
        this.enabled = Boolean(this.apiKey);
    }

    async sendSecurityAlert(
        recipients: string[],
        alert: {
            title: string;
            message: string;
            severity: string;
            metadata?: Record<string, any>;
        }
    ): Promise<void> {
        if (!this.enabled || recipients.length === 0) return;

        try {
            const htmlContent = this.generateAlertHTML(alert);
            const textContent = this.generateAlertText(alert);

            // Implementation depends on your email service
            // Example with SendGrid
            const payload = {
                personalizations: [
                    {
                        to: recipients.map(email => ({ email })),
                        subject: `[SECURITY ALERT] ${alert.title}`
                    }
                ],
                from: { email: this.fromEmail },
                content: [
                    { type: 'text/plain', value: textContent },
                    { type: 'text/html', value: htmlContent }
                ]
            };

            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`SendGrid API error: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to send email notification:', error);
        }
    }

    private generateAlertHTML(alert: any): string {
        return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin: 0;">Security Alert</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px;">${alert.title}</p>
            </div>
            
            <div style="background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px;">
              <h3>Alert Details</h3>
              <p><strong>Severity:</strong> <span style="color: ${this.getSeverityColor(alert.severity)};">${alert.severity.toUpperCase()}</span></p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>Message:</strong> ${alert.message}</p>
              
              ${alert.metadata ? `
                <h4>Additional Information</h4>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(alert.metadata, null, 2)}</pre>
              ` : ''}
            </div>
            
            <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
              This is an automated security notification. Please do not reply to this email.
            </div>
          </div>
        </body>
      </html>
    `;
    }

    private generateAlertText(alert: any): string {
        return `
SECURITY ALERT: ${alert.title}

Severity: ${alert.severity.toUpperCase()}
Timestamp: ${new Date().toISOString()}
Message: ${alert.message}

${alert.metadata ? `Additional Information:\n${JSON.stringify(alert.metadata, null, 2)}` : ''}

This is an automated security notification.
    `.trim();
    }

    private getSeverityColor(severity: string): string {
        switch (severity) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#d97706';
            case 'low': return '#65a30d';
            default: return '#6b7280';
        }
    }
}