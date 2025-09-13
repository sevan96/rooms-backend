import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import { Meeting } from '../meeting/meeting.schema';
import {
  CalendarLinksUtil,
  CalendarEvent,
} from '../meeting/utils/calendar-links.util';

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configuration pour un serveur SMTP de développement (vous pouvez utiliser Mailtrap, SendGrid, etc.)
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp-relay.brevo.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>(
          'SMTP_USER',
          'sevanakoumia@gmail.com',
        ),
        pass: this.configService.get<string>('SMTP_PASS', 'EtKCNQjnDIP3dsRa'),
      },
    });
    Logger.log(
      `Email service initialized with SMTP host: ${this.configService.get<string>(
        'SMTP_HOST',
        'smtp-relay.brevo.com',
      )}`,
    );

    // En mode développement, utiliser ethereal email si pas de config SMTP
    if (
      !this.configService.get<string>('SMTP_USER', 'sevanakoumia@gmail.com')
    ) {
      this.createTestAccount();
    }
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(`Test email account created: ${testAccount.user}`);
    } catch (error) {
      this.logger.error('Failed to create test email account', error);
    }
  }

  async sendOrganizerNotification(
    meeting: Meeting,
    roomName: string,
  ): Promise<void> {
    try {
      const calendarEvent: CalendarEvent = {
        title: meeting.title,
        description: meeting.description,
        startDate: meeting.start_date,
        endDate: meeting.end_date,
        location: roomName,
      };

      const templateData = {
        organizerName: meeting.organizer_full_name,
        title: meeting.title,
        description: meeting.description,
        startDate: this.formatDate(meeting.start_date),
        endDate: this.formatDate(meeting.end_date),
        roomName: roomName,
        attendeesCount: meeting.attendees.length,
        accessCode: meeting.access_code,
        googleCalendarLink:
          CalendarLinksUtil.generateGoogleCalendarLink(calendarEvent),
        outlookCalendarLink:
          CalendarLinksUtil.generateOutlookCalendarLink(calendarEvent),
        icsDownloadLink: CalendarLinksUtil.generateICSDownloadLink(
          meeting._id.toString(),
        ),
        eventDetailsLink: CalendarLinksUtil.generateEventDetailsLink(
          meeting._id.toString(),
        ),
      };

      await this.sendEmail({
        to: meeting.organizer_email,
        subject: `Confirmation de réunion : ${meeting.title}`,
        template: 'organizer-notification',
        data: templateData,
      });

      this.logger.log(
        `Organizer notification sent to ${meeting.organizer_email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send organizer notification: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  async sendAttendeeInvitations(
    meeting: Meeting,
    roomName: string,
  ): Promise<void> {
    try {
      const calendarEvent: CalendarEvent = {
        title: meeting.title,
        description: meeting.description,
        startDate: meeting.start_date,
        endDate: meeting.end_date,
        location: roomName,
      };

      const templateData = {
        title: meeting.title,
        description: meeting.description,
        startDate: this.formatDate(meeting.start_date),
        endDate: this.formatDate(meeting.end_date),
        roomName: roomName,
        attendeesCount: meeting.attendees.length,
        organizerName: meeting.organizer_full_name,
        organizerEmail: meeting.organizer_email,
        googleCalendarLink:
          CalendarLinksUtil.generateGoogleCalendarLink(calendarEvent),
        outlookCalendarLink:
          CalendarLinksUtil.generateOutlookCalendarLink(calendarEvent),
        icsDownloadLink: CalendarLinksUtil.generateICSDownloadLink(
          meeting._id.toString(),
        ),
      };

      // Envoyer à tous les participants sauf l'organisateur
      const attendeesToNotify = meeting.attendees.filter(
        (attendee) => attendee !== meeting.organizer_email,
      );

      const emailPromises = attendeesToNotify.map((attendee) =>
        this.sendEmail({
          to: attendee,
          subject: `Invitation : ${meeting.title}`,
          template: 'attendee-invitation',
          data: templateData,
        }),
      );

      await Promise.all(emailPromises);

      this.logger.log(
        `Attendee invitations sent to ${attendeesToNotify.length} participants`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send attendee invitations: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  async sendCancellationNotification(
    meeting: Meeting,
    roomName: string,
  ): Promise<void> {
    try {
      const templateData = {
        title: meeting.title,
        description: meeting.description,
        startDate: this.formatDate(meeting.start_date),
        endDate: this.formatDate(meeting.end_date),
        roomName: roomName,
        organizerName: meeting.organizer_full_name,
        organizerEmail: meeting.organizer_email,
        cancelledBy: meeting.cancelled_by,
        cancelledAt: this.formatDate(meeting.cancelled_at),
        cancelledReason: meeting.cancelled_reason,
      };

      // Envoyer à tous les participants y compris l'organisateur
      const emailPromises = meeting.attendees.map((attendee) =>
        this.sendEmail({
          to: attendee,
          subject: `ANNULÉE : ${meeting.title}`,
          template: 'meeting-cancelled',
          data: templateData,
        }),
      );

      await Promise.all(emailPromises);

      this.logger.log(
        `Cancellation notifications sent to ${meeting.attendees.length} participants`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send cancellation notifications: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  async sendOrganizerUpdateNotification(
    meeting: Meeting,
    roomName: string,
  ): Promise<void> {
    try {
      const calendarEvent: CalendarEvent = {
        title: meeting.title,
        description: meeting.description,
        startDate: meeting.start_date,
        endDate: meeting.end_date,
        location: roomName,
      };

      const templateData = {
        organizerName: meeting.organizer_full_name,
        title: meeting.title,
        description: meeting.description,
        startDate: this.formatDate(meeting.start_date),
        endDate: this.formatDate(meeting.end_date),
        roomName: roomName,
        attendeesCount: meeting.attendees.length,
        accessCode: meeting.access_code,
        googleCalendarLink:
          CalendarLinksUtil.generateGoogleCalendarLink(calendarEvent),
        outlookCalendarLink:
          CalendarLinksUtil.generateOutlookCalendarLink(calendarEvent),
        icsDownloadLink: CalendarLinksUtil.generateICSDownloadLink(
          meeting._id.toString(),
        ),
        eventDetailsLink: CalendarLinksUtil.generateEventDetailsLink(
          meeting._id.toString(),
        ),
      };

      await this.sendEmail({
        to: meeting.organizer_email,
        subject: `Moification de réunion : ${meeting.title}`,
        template: 'organizer-meeting-update',
        data: templateData,
      });

      this.logger.log(
        `Organizer notification sent to ${meeting.organizer_email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send organizer notification: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  async sendUpdateNotification(
    oldMeeting: Meeting,
    meeting: Meeting,
    roomName: string,
  ): Promise<void> {
    try {
      const calendarEvent: CalendarEvent = {
        title: meeting.title,
        description: meeting.description,
        startDate: meeting.start_date,
        endDate: meeting.end_date,
        location: roomName,
      };

      const templateData = {
        title: oldMeeting.title,
        description: oldMeeting.description,
        startDate: this.formatDate(oldMeeting.start_date),
        endDate: this.formatDate(oldMeeting.end_date),
        updatedTitle: meeting.title,
        upatedDescription: meeting.description,
        upatedStartDate: this.formatDate(meeting.start_date),
        updatedEndDate: this.formatDate(meeting.end_date),
        roomName: roomName,
        attendeesCount: meeting.attendees.length,
        organizerName: meeting.organizer_full_name,
        organizerEmail: meeting.organizer_email,
        googleCalendarLink:
          CalendarLinksUtil.generateGoogleCalendarLink(calendarEvent),
        outlookCalendarLink:
          CalendarLinksUtil.generateOutlookCalendarLink(calendarEvent),
        icsDownloadLink: CalendarLinksUtil.generateICSDownloadLink(
          meeting._id.toString(),
        ),
      };

      // Envoyer à tous les participants sauf l'organisateur
      const attendeesToNotify = meeting.attendees.filter(
        (attendee) => attendee !== meeting.organizer_email,
      );

      const emailPromises = attendeesToNotify.map((attendee) =>
        this.sendEmail({
          to: attendee,
          subject: `Modification de réunion : ${meeting.title}`,
          template: 'meeting-updated',
          data: templateData,
        }),
      );

      await Promise.all(emailPromises);

      this.logger.log(
        `Attendee invitations sent to ${attendeesToNotify.length} participants`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send attendee invitations: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  private async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const template = await this.loadTemplate(emailData.template);
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(emailData.data);

      const mailOptions = {
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"Système de Réservation" <no-reply@rooms-backend.com>',
        ),
        to: emailData.to,
        subject: emailData.subject,
        html: html,
      };

      const result = await this.transporter.sendMail(mailOptions);

      // En mode développement avec ethereal, log l'URL de prévisualisation
      if (result.messageId && result.messageId.includes('ethereal')) {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(result)}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${emailData.to}: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(
        __dirname,
        'templates',
        `${templateName}.hbs`,
      );
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      this.logger.error(
        `Failed to load template ${templateName}: ${error.message}`,
        error,
      );
      throw new Error(`Template ${templateName} not found`);
    }
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      // timeZone: 'Europe/Paris',
    }).format(new Date(date));
  }
}
