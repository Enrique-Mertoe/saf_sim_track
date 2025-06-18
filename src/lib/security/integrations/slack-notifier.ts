// =============================================
// EXTERNAL INTEGRATIONS
// =============================================

// lib/security/integrations/slack-notifier.ts
export class SlackNotifier {
    private webhookUrl: string;
    private enabled: boolean;

    constructor() {
        this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
        this.enabled = Boolean(this.webhookUrl);
    }

    async sendAlert(alert: {
        title: string;
        message: string;
        severity: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        if (!this.enabled) return;

        try {
            const color = this.getSeverityColor(alert.severity);
            const payload = {
                text: `🚨 Security Alert: ${alert.title}`,
                attachments: [
                    {
                        color,
                        fields: [
                            {
                                title: 'Severity',
                                value: alert.severity.toUpperCase(),
                                short: true
                            },
                            {
                                title: 'Timestamp',
                                value: new Date().toISOString(),
                                short: true
                            },
                            {
                                title: 'Message',
                                value: alert.message,
                                short: false
                            }
                        ]
                    }
                ]
            };

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Slack API error: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to send Slack notification:', error);
        }
    }

    async sendIncidentUpdate(incident: {
        id: string;
        title: string;
        status: string;
        severity: string;
        assignedTo?: string;
    }): Promise<void> {
        if (!this.enabled) return;

        const statusEmoji = {
            open: '🔴',
            investigating: '🟡',
            contained: '🟠',
            resolved: '🟢',
            closed: '✅'
        };

        await this.sendAlert({
            title: `Incident ${incident.status.toUpperCase()}: ${incident.title}`,
            //@ts-ignore
            message: `${statusEmoji[incident.status]} Incident #${incident.id} has been ${incident.status}${incident.assignedTo ? ` by ${incident.assignedTo}` : ''}`,
            severity: incident.severity
        });
    }

    private getSeverityColor(severity: string): string {
        switch (severity) {
            case 'critical': return 'danger';
            case 'high': return 'warning';
            case 'medium': return '#ff9900';
            case 'low': return 'good';
            default: return '#cccccc';
        }
    }
}