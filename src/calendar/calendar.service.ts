import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meeting } from '../meeting/meeting.schema';
import { Room } from '../room/room.schema';
import {
  CalendarLinksUtil,
  CalendarEvent,
} from '../meeting/utils/calendar-links.util';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<Meeting>,
    @InjectModel(Room.name) private roomModel: Model<Room>,
  ) {}

  async generateICSForMeeting(meetingId: string): Promise<string> {
    const meeting = await this.meetingModel.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException(`Réunion avec l'ID ${meetingId} non trouvée`);
    }

    // Récupérer les informations de la salle
    const room = await this.roomModel.findById(meeting.room);
    const roomName = room ? room.name : 'Salle inconnue';

    const calendarEvent: CalendarEvent = {
      title: meeting.title,
      description: meeting.description,
      startDate: meeting.start_date,
      endDate: meeting.end_date,
      location: roomName,
    };

    return CalendarLinksUtil.generateICSContent(calendarEvent);
  }
}
