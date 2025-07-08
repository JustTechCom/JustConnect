// backend/src/services/emailService.ts
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';
import handlebars from 'handlebars';

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  templateData?: any;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

interface EmailTemplate {
  welcome: {
    firstName: string;
    activationLink: string;
  };
  resetPassword: {
    firstName: string;
    resetLink: string;
    expiresIn: string;
  };
  emailVerification: {
    firstName: string;
    verificationLink: string;
  };
  newMessage: {
    firstName: string;
    senderName: string;
    messagePreview: string;
    chatLink: string;
  };
  securityAlert: {
    firstName: string;
    alertType: string;
    timestamp: string;
    ipAddress: string;
    device: string;
  };
  newsletter: {
    firstName: string;
    updates: Array<{
      title: string;
      description: string;
      link?: string;
    }>;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private oauth2Client: any;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.initializeOAuth();
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeOAuth() {
    if (process.env.EMAIL_PROVIDER === 'gmail') {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );

      this.oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      });
    }
  }

  private async initializeTransporter() {
    const provider = process.env.EMAIL_PROVIDER || 'smtp';

    switch (provider) {
      case 'gmail':
        const accessToken = await this.oauth2Client.getAccessToken();
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_FROM,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken.token,
          },
        });
        break;

      case 'sendgrid':
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        });
        break;

      case 'mailgun':
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: process.env.MAILGUN_USERNAME,
            pass: process.env.MAILGUN_PASSWORD,
          },
        });
        break;

      case 'aws-ses':
        this.transporter = nodemailer.createTransporter({
          host: `email-smtp.${process.env.AWS_REGION}.amazonaws.com`,
          port: 587,
          secure: false,
          auth: {
            user: process.env.AWS_SES_ACCESS_KEY,
            pass: process.env.AWS_SES_SECRET_KEY,
          },
        });
        break;

      default:
        // SMTP fallback
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
    }

    // Verify connection
    try {
      await this.transporter.verify();
      console.log('📧 Email service connected successfully');
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
    }
  }

  private loadTemplates() {
    const templateDir = join(__dirname, '../templates/email');
    const templateFiles = [
      'welcome.hbs',
      'reset-password.hbs', 
      'email-verification.hbs',
      'new-message.hbs',
      'security-alert.hbs',
      'newsletter.hbs',
    ];

    templateFiles.forEach(file => {
      try {
        const templatePath = join(templateDir, file);
        const templateContent = readFileSync(templatePath, 'utf8');
        const compiled = handlebars.compile(templateContent);
        const templateName = file.replace('.hbs', '');
        this.templates.set(templateName, compiled);
      } catch (error) {
        console.warn(`Template ${file} not found, using fallback`);
      }
    });

    // Register Handlebars helpers
    handlebars.registerHelper('formatDate', (date: Date) => {
      return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    });

    handlebars.registerHelper('truncate', (str: string, length: number) => {
      return str.length > length ? str.substring(0, length) + '...' : str;
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      let html = options.html;
      let text = options.text;

      // Use template if specified
      if (options.template && this.templates.has(options.template)) {
        const template = this.templates.get(options.template)!;
        html = template(options.templateData || {});
        text = this.stripHtml(html);
      }

      const mailOptions = {
        from: `${process.env.APP_NAME} <${process.env.EMAIL_FROM}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text,
        attachments: options.attachments,
        headers: {
          'X-Mailer': 'JustConnect',
          'X-Priority': '3',
        },
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, data: EmailTemplate['welcome']): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `${process.env.APP_NAME}'e Hoş Geldiniz! 🎉`,
      template: 'welcome',
      templateData: data,
    });
  }

  async sendPasswordResetEmail(to: string, data: EmailTemplate['resetPassword']): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Şifre Sıfırlama Talebi 🔐',
      template: 'reset-password',
      templateData: data,
    });
  }

  async sendEmailVerification(to: string, data: EmailTemplate['emailVerification']): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'E-posta Adresinizi Doğrulayın ✅',
      template: 'email-verification',
      templateData: data,
    });
  }

  async sendNewMessageNotification(to: string, data: EmailTemplate['newMessage']): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `${data.senderName} size yeni bir mesaj gönderdi 💬`,
      template: 'new-message',
      templateData: data,
    });
  }

  async sendSecurityAlert(to: string, data: EmailTemplate['securityAlert']): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: '🔒 Güvenlik Uyarısı - Hesap Aktivitesi',
      template: 'security-alert',
      templateData: data,
    });
  }

  async sendNewsletter(to: string[], data: EmailTemplate['newsletter']): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `${process.env.APP_NAME} Haberleri - ${new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`,
      template: 'newsletter',
      templateData: data,
    });
  }

  async sendBulkEmail(emails: Array<{ to: string; subject: string; template: string; data: any }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // Send emails in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const promises = batch.map(async (email) => {
        try {
          await this.sendEmail({
            to: email.to,
            subject: email.subject,
            template: email.template,
            templateData: email.data,
          });
          success++;
        } catch (error) {
          console.error(`Failed to send email to ${email.to}:`, error);
          failed++;
        }
      });

      await Promise.all(promises);
      
      // Add delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success, failed };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }

  // Email templates as fallbacks if file templates don't exist
  private getDefaultTemplate(templateName: string): string {
    const templates: Record<string, string> = {
      'welcome': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">{{firstName}}, JustConnect'e Hoş Geldiniz! 🎉</h2>
          <p>Hesabınız başarıyla oluşturuldu. Şimdi arkadaşlarınızla sohbet etmeye başlayabilirsiniz.</p>
          <a href="{{activationLink}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Hesabımı Aktifleştir</a>
          <p style="margin-top: 20px; color: #666;">Bu bağlantı 24 saat geçerlidir.</p>
        </div>
      `,
      'reset-password': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Şifre Sıfırlama 🔐</h2>
          <p>Merhaba {{firstName}},</p>
          <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
          <a href="{{resetLink}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Şifremi Sıfırla</a>
          <p style="margin-top: 20px; color: #666;">Bu bağlantı {{expiresIn}} geçerlidir.</p>
        </div>
      `,
    };

    return templates[templateName] || '<p>{{message}}</p>';
  }
}

export const emailService = new EmailService();
export default emailService;