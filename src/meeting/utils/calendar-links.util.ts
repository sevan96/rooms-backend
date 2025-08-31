import { Logger } from '@nestjs/common';

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export class CalendarLinksUtil {
  /**
   * Génère un lien pour Google Calendar
   */
  static generateGoogleCalendarLink(event: CalendarEvent): string {
    const startDate = this.formatDateForGoogle(event.startDate);
    const endDate = this.formatDateForGoogle(event.endDate);
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: event.description,
      ...(event.location && { location: event.location }),
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Génère un lien pour Outlook (Office 365)
   */
  static generateOutlookCalendarLink(event: CalendarEvent): string {
    const startDate = event.startDate.toISOString();
    const endDate = event.endDate.toISOString();
    const params = new URLSearchParams({
      subject: event.title,
      startdt: startDate,
      enddt: endDate,
      body: event.description,
      ...(event.location && { location: event.location }),
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  /**
   * Génère un fichier ICS pour Apple Calendar et autres clients
   */
  static generateICSContent(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = formatDate(event.startDate);
    const endDate = formatDate(event.endDate);
    const now = formatDate(new Date());

    // Générer un UID unique pour l'événement
    const uid = `${now}-${Math.random().toString(36).substring(2, 15)}@rooms-backend`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Rooms Backend//Meeting Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `DTSTAMP:${now}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description !== undefined ? event.description.replace(/\n/g, '\\n') : ''}`,
    ];

    if (event.location) {
      icsContent.push(`LOCATION:${event.location}`);
    }

    icsContent.push(
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    );

    return icsContent.join('\r\n');
  }

  /**
   * Génère un lien de téléchargement pour le fichier ICS
   */
  static generateICSDownloadLink(meetingId: string): string {
    // Utiliser l'endpoint REST pour servir le fichier ICS
    Logger.log(
      `https://rooms-backend-2shj.onrender.com/calendar/ics/${meetingId}`,
    );
    return `https://rooms-backend-2shj.onrender.com/calendar/ics/${meetingId}`;
  }

  /**
   * Génère un lien de téléchargement pour le fichier ICS (méthode legacy avec data URL)
   */
  static generateICSDownloadLinkLegacy(event: CalendarEvent): string {
    const icsContent = this.generateICSContent(event);
    const blob = Buffer.from(icsContent).toString('base64');
    return `data:text/calendar;base64,${blob}`;
  }

  /**
   * Formate une date pour Google Calendar (YYYYMMDDTHHMMSSZ)
   */
  private static formatDateForGoogle(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}
