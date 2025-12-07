// Mailgun adapter for SmarterOS Runtime Validator
// Replaces Resend with Mailgun + proper tagging for tracking

import FormData from 'form-data';
import Mailgun from 'mailgun.js';

interface MailgunConfig {
  apiKey: string;
  domain: string;
  from: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  tags?: string[];
  variables?: Record<string, string>;
}

export class MailgunAdapter {
  private mg: any;
  private domain: string;
  private from: string;

  constructor(config: MailgunConfig) {
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: config.apiKey
    });
    this.domain = config.domain;
    this.from = config.from;
  }

  /**
   * Send email with Mailgun tagging for tracking
   * Tags follow SmarterOS convention: system:component:action
   */
  async sendEmail(options: EmailOptions): Promise<{ id: string; message: string }> {
    const defaultTags = [
      'smarteros',
      'runtime-validator',
      'alert'
    ];

    const tags = options.tags ? [...defaultTags, ...options.tags] : defaultTags;

    const messageData: any = {
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      'o:tag': tags,
      'o:tracking': 'yes',
      'o:tracking-clicks': 'yes',
      'o:tracking-opens': 'yes'
    };

    // Add custom variables for later retrieval
    if (options.variables) {
      Object.entries(options.variables).forEach(([key, value]) => {
        messageData[`v:${key}`] = value;
      });
    }

    try {
      const result = await this.mg.messages.create(this.domain, messageData);
      
      return {
        id: result.id,
        message: result.message || 'Email sent successfully'
      };
    } catch (error: any) {
      throw new Error(`Mailgun error: ${error.message}`);
    }
  }

  /**
   * Send scout alert with proper categorization
   */
  async sendScoutAlert(params: {
    to: string;
    scoutTitle: string;
    scoutGoal: string;
    content: string;
    severity: 'info' | 'warning' | 'critical';
    tenantRut?: string;
    scoutId?: string;
  }): Promise<{ id: string; message: string }> {
    const tags = [
      `severity:${params.severity}`,
      'scout-alert',
      params.tenantRut ? `tenant:${params.tenantRut}` : 'tenant:unknown'
    ];

    const variables: Record<string, string> = {
      scout_title: params.scoutTitle,
      severity: params.severity
    };

    if (params.scoutId) {
      variables.scout_id = params.scoutId;
    }

    const html = this.formatScoutAlertEmail(params);

    return this.sendEmail({
      to: params.to,
      subject: `[${params.severity.toUpperCase()}] Scout Alert: ${params.scoutTitle}`,
      html,
      tags,
      variables
    });
  }

  /**
   * Send validation failure alert
   */
  async sendValidationAlert(params: {
    to: string;
    domain: string;
    failureType: 'link' | 'checkout' | 'semantic';
    details: string;
    tenantRut?: string;
  }): Promise<{ id: string; message: string }> {
    const tags = [
      'validation-failure',
      `failure:${params.failureType}`,
      params.tenantRut ? `tenant:${params.tenantRut}` : 'tenant:unknown'
    ];

    const variables = {
      domain: params.domain,
      failure_type: params.failureType
    };

    const html = this.formatValidationAlertEmail(params);

    return this.sendEmail({
      to: params.to,
      subject: `⚠️ Validation Failure: ${params.domain}`,
      html,
      tags,
      variables
    });
  }

  /**
   * Format scout alert email
   */
  private formatScoutAlertEmail(params: {
    scoutTitle: string;
    scoutGoal: string;
    content: string;
    severity: string;
  }): string {
    const severityColor = {
      info: '#0066CC',
      warning: '#FF8C00',
      critical: '#DC3545'
    }[params.severity] || '#0066CC';

    const severityIcon = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🔴'
    }[params.severity] || 'ℹ️';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${severityColor}; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${severityIcon} SmarterOS Runtime Alert
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #262626; font-size: 16px; line-height: 1.5;">
                Scout <strong>${params.scoutTitle}</strong> detected an issue.
              </p>

              <div style="background-color: #f9f9f9; border-left: 4px solid ${severityColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Scout Goal
                </p>
                <p style="margin: 0; color: #262626; font-size: 14px;">
                  ${params.scoutGoal}
                </p>
              </div>

              <div style="margin: 30px 0; color: #262626; font-size: 15px; line-height: 1.6;">
                ${params.content}
              </div>

              <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                <a href="https://dash.smarterbot.cl" style="display: inline-block; background-color: ${severityColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Dashboard
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; color: #999; font-size: 13px;">
                SmarterOS Runtime Validator
              </p>
              <p style="margin: 0; color: #999; font-size: 13px;">
                Powered by OpenSpec governance
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Format validation alert email
   */
  private formatValidationAlertEmail(params: {
    domain: string;
    failureType: string;
    details: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #DC3545; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ⚠️ Validation Failure
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #262626; font-size: 16px; line-height: 1.5;">
                Validation failed for <strong>${params.domain}</strong>
              </p>

              <div style="background-color: #fff3cd; border-left: 4px solid #DC3545; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Failure Type: ${params.failureType}
                </p>
                <p style="margin: 0; color: #262626; font-size: 14px; line-height: 1.6;">
                  ${params.details}
                </p>
              </div>

              <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                <a href="https://dash.smarterbot.cl" style="display: inline-block; background-color: #DC3545; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Details
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #999; font-size: 13px;">
                SmarterOS Runtime Validator • Powered by OpenSpec
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

// Factory function for easy initialization
export function createMailgunAdapter(): MailgunAdapter {
  const config = {
    apiKey: process.env.MAILGUN_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || 'smarterbot.store',
    from: process.env.MAILGUN_FROM || 'SmarterOS Runtime <alertas@smarterbot.store>'
  };

  if (!config.apiKey) {
    throw new Error('MAILGUN_API_KEY environment variable is required');
  }

  return new MailgunAdapter(config);
}
