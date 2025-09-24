import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meeting, MeetingStatus } from './meeting.schema';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { CancelMeetingDto } from './dto/cancel-meeting.dto';
import { CancelByAccessCodeDto } from './dto/cancel-by-access-code.dto';
import { PrivilegedUserService } from '../privileged-user/privileged-user.service';
import { RoomService } from '../room/room.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class MeetingService {
  constructor(
    @InjectModel(Meeting.name) private readonly meetingModel: Model<Meeting>,
    private readonly privilegedUserService: PrivilegedUserService,
    private readonly roomService: RoomService,
    private readonly emailService: EmailService,
  ) {}

  async create(createMeetingDto: CreateMeetingDto): Promise<Meeting> {
    // Valider les dates
    const startDate = new Date(createMeetingDto.start_date);
    const endDate = new Date(createMeetingDto.end_date);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }

    if (startDate < new Date()) {
      throw new BadRequestException(
        'La date de début ne peut pas être dans le passé',
      );
    }

    // Vérifier que la salle existe et est disponible
    const room = await this.roomService.findOne(createMeetingDto.room);
    if (!room.available) {
      throw new BadRequestException("La salle n'est pas disponible");
    }

    // Vérifier si l'organisateur est privilégié
    const isPrivileged = await this.privilegedUserService.isPrivilegedUser(
      createMeetingDto.organizer_email,
    );

    if (isPrivileged) {
      // Si l'utilisateur est privilégié, annuler toutes les réunions en conflit
      await this.cancelConflictingMeetings(
        createMeetingDto.room,
        startDate,
        endDate,
        `Annulée automatiquement - conflit avec une réunion d'un utilisateur privilégié (${createMeetingDto.organizer_full_name})`,
        'SYSTEM',
      );
    } else {
      // Si l'utilisateur n'est pas privilégié, vérifier qu'il n'y a pas de conflit
      const conflicts = await this.findConflictingMeetings(
        createMeetingDto.room,
        startDate,
        endDate,
      );

      if (conflicts.length > 0) {
        throw new ConflictException(
          'Il existe déjà des réunions programmées sur ce créneau',
        );
      }
    }

    // Générer un code d'accès unique
    const accessCode = this.generateAccessCode();

    // Créer la réunion
    const meeting = new this.meetingModel({
      ...createMeetingDto,
      start_date: startDate,
      end_date: endDate,
      is_organizer_privileged: isPrivileged,
      access_code: accessCode,
    });

    const savedMeeting = await meeting.save();

    // Envoyer les emails de notification (en arrière-plan pour ne pas bloquer la réponse)
    this.sendMeetingNotifications(savedMeeting, room.name).catch((error) => {
      console.error('Failed to send meeting notifications:', error);
    });

    return savedMeeting;
  }

  async findAll(): Promise<Meeting[]> {
    return this.meetingModel.find().populate('room').exec();
  }

  async findOne(id: string): Promise<Meeting> {
    const meeting = await this.meetingModel
      .findById(id)
      .populate('room')
      .exec();
    if (!meeting) {
      throw new NotFoundException('Réunion non trouvée');
    }
    return meeting;
  }

  async findByRoom(roomId: string, status?: MeetingStatus): Promise<Meeting[]> {
    const query: any = { room: roomId };
    if (status) {
      query.status = status;
    }
    return this.meetingModel.find(query).populate('room').exec();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Meeting[]> {
    return this.meetingModel
      .find({
        $or: [
          {
            start_date: { $gte: startDate, $lt: endDate },
          },
          {
            end_date: { $gt: startDate, $lte: endDate },
          },
          {
            start_date: { $lte: startDate },
            end_date: { $gte: endDate },
          },
        ],
        status: MeetingStatus.SCHEDULED,
      })
      .populate('room')
      .exec();
  }

  async findByOrganizer(organizerEmail: string): Promise<Meeting[]> {
    return this.meetingModel
      .find({ organizer_email: organizerEmail })
      .populate('room')
      .exec();
  }

  async cancel(
    id: string,
    cancelMeetingDto: CancelMeetingDto,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findById(id).exec();
    if (!meeting) {
      throw new NotFoundException('Réunion non trouvée');
    }

    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException(
        'Seules les réunions programmées peuvent être annulées',
      );
    }

    meeting.status = MeetingStatus.CANCELLED;
    meeting.cancelled_reason = cancelMeetingDto.cancelled_reason;
    meeting.cancelled_by = cancelMeetingDto.cancelled_by || 'Unknown';
    meeting.cancelled_at = new Date();

    const savedMeeting = await meeting.save();

    // Envoyer les emails de notification d'annulation (en arrière-plan)
    const populatedMeeting = await this.meetingModel
      .findById(savedMeeting._id)
      .populate('room')
      .exec();
    this.sendCancellationNotifications(populatedMeeting).catch((error) => {
      console.error('Failed to send cancellation notifications:', error);
    });

    return savedMeeting;
  }

  async remove(id: string): Promise<void> {
    const result = await this.meetingModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Réunion non trouvée');
    }
  }

  async update(
    id: string,
    createMeetingDto: CreateMeetingDto,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel.findById(id).exec();
    if (!meeting) {
      throw new NotFoundException('Réunion non trouvée');
    }

    const oldMeeting = meeting.toObject();

    // Valider les dates
    const startDate = new Date(createMeetingDto.start_date);
    const endDate = new Date(createMeetingDto.end_date);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }

    if (startDate < new Date()) {
      throw new BadRequestException(
        'La date de début ne peut pas être dans le passé',
      );
    }

    // Vérifier que la salle existe et est disponible
    const room = await this.roomService.findOne(meeting.room as any);
    if (!room.available) {
      throw new BadRequestException("La salle n'est pas disponible");
    }

    const conflicts =
      await this.findConflictingMeetingsThatDoNotConcernThisMeeting(
        meeting.room as any,
        id,
        startDate,
        endDate,
      );

    if (conflicts.length > 0) {
      if (conflicts.some((conflict) => JSON.stringify(conflict._id) !== id)) {
        throw new ConflictException(
          'Il existe déjà des réunions programmées sur ce créneau',
        );
      }
    }

    meeting.title = createMeetingDto.title ?? meeting.title;
    meeting.description = createMeetingDto.description ?? meeting.description;
    meeting.attendees = createMeetingDto.attendees ?? meeting.attendees;
    meeting.organizer_email =
      createMeetingDto.organizer_email ?? meeting.organizer_email;
    meeting.organizer_full_name =
      createMeetingDto.organizer_full_name ?? meeting.organizer_full_name;
    meeting.start_date = startDate;
    meeting.end_date = endDate;
    meeting.end_date = endDate;

    const updatedMeeting = await meeting.save();

    // Envoyer les emails de notification (en arrière-plan pour ne pas bloquer la réponse)
    this.sendMeetingUpdateNotifications(
      oldMeeting,
      updatedMeeting,
      room.name,
    ).catch((error) => {
      console.error('Failed to send meeting notifications:', error);
    });

    return updatedMeeting;
  }

  private async findConflictingMeetings(
    roomId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Meeting[]> {
    return this.meetingModel
      .find({
        room: roomId,
        status: MeetingStatus.SCHEDULED,
        $or: [
          {
            start_date: { $gte: startDate, $lt: endDate },
          },
          {
            end_date: { $gt: startDate, $lte: endDate },
          },
          {
            start_date: { $lte: startDate },
            end_date: { $gte: endDate },
          },
        ],
      })
      .exec();
  }

  private async findConflictingMeetingsThatDoNotConcernThisMeeting(
    roomId: string,
    meetingId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Meeting[]> {
    return this.meetingModel
      .find({
        room: roomId,
        status: MeetingStatus.SCHEDULED,
        $or: [
          {
            start_date: { $gte: startDate, $lt: endDate },
          },
          {
            end_date: { $gt: startDate, $lte: endDate },
          },
          {
            start_date: { $lte: startDate },
            end_date: { $gte: endDate },
          },
        ],
      })
      .where('_id')
      .ne(meetingId)
      .exec();
  }

  private async cancelConflictingMeetings(
    roomId: string,
    startDate: Date,
    endDate: Date,
    reason: string,
    cancelledBy: string,
  ): Promise<void> {
    const conflictingMeetings = await this.findConflictingMeetings(
      roomId,
      startDate,
      endDate,
    );

    const cancelPromises = conflictingMeetings.map(async (meeting) => {
      meeting.status = MeetingStatus.CANCELLED;
      meeting.cancelled_reason = reason;
      meeting.cancelled_by = cancelledBy;
      meeting.cancelled_at = new Date();
      return meeting.save();
    });

    await Promise.all(cancelPromises);
  }

  async getUpcomingMeetings(limit: number = 10): Promise<Meeting[]> {
    const now = new Date();
    return this.meetingModel
      .find({
        start_date: { $gte: now },
        status: MeetingStatus.SCHEDULED,
      })
      .sort({ start_date: 1 })
      .limit(limit)
      .populate('room')
      .exec();
  }

  async getRoomSchedule(roomId: string, date: Date): Promise<Meeting[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.meetingModel
      .find({
        room: roomId,
        start_date: { $gte: startOfDay, $lte: endOfDay },
        status: MeetingStatus.SCHEDULED,
      })
      .sort({ start_date: 1 })
      .populate('room')
      .exec();
  }

  /**
   * Annuler une réunion en utilisant le code d'accès
   */
  async cancelByAccessCode(
    cancelByAccessCodeDto: CancelByAccessCodeDto,
  ): Promise<Meeting> {
    const meeting = await this.meetingModel
      .findOne({ access_code: cancelByAccessCodeDto.access_code })
      .populate('room')
      .exec();

    if (!meeting) {
      throw new NotFoundException(
        "Aucune réunion trouvée avec ce code d'accès",
      );
    }

    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException(
        'Seules les réunions programmées peuvent être annulées',
      );
    }

    meeting.status = MeetingStatus.CANCELLED;
    meeting.cancelled_reason = cancelByAccessCodeDto.cancelled_reason;
    meeting.cancelled_by =
      cancelByAccessCodeDto.cancelled_by || meeting.organizer_full_name;
    meeting.cancelled_at = new Date();

    const savedMeeting = await meeting.save();

    // Envoyer les emails de notification d'annulation (en arrière-plan)
    this.sendCancellationNotifications(savedMeeting).catch((error) => {
      console.error('Failed to send cancellation notifications:', error);
    });

    return savedMeeting;
  }

  /**
   * Obtenir les informations d'une réunion en utilisant un code d'accès unique
   */
  async getByAccessCode(accessCode: string): Promise<Meeting> {
    return this.meetingModel
      .findOne({ access_code: accessCode })
      .populate('room')
      .exec();
  }

  /**
   * Générer un code d'accès unique pour une réunion
   */
  private generateAccessCode(): string {
    // Générer un code de 12 caractères alphanumériques
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Envoyer les notifications email pour une nouvelle réunion
   */
  private async sendMeetingNotifications(
    meeting: Meeting,
    roomName: string,
  ): Promise<void> {
    try {
      // Envoyer l'email à l'organisateur
      await this.emailService.sendOrganizerNotification(meeting, roomName);

      // Envoyer les invitations aux participants
      await this.emailService.sendAttendeeInvitations(meeting, roomName);
    } catch (error) {
      console.error('Error sending meeting notifications:', error);
      throw error;
    }
  }

  /**
   * Envoyer les notifications email pour une réunion annulée
   */
  private async sendCancellationNotifications(meeting: Meeting): Promise<void> {
    try {
      const roomName = meeting.room
        ? (meeting.room as any).name
        : 'Salle inconnue';
      await this.emailService.sendCancellationNotification(meeting, roomName);
    } catch (error) {
      console.error('Error sending cancellation notifications:', error);
      throw error;
    }
  }

  /**
   * Envoyer les notifications email pour une modification de réunion
   */
  private async sendMeetingUpdateNotifications(
    oldMeeting: Meeting,
    meeting: Meeting,
    roomName: string,
  ): Promise<void> {
    try {
      // Envoyer l'email à l'organisateur
      await this.emailService.sendOrganizerUpdateNotification(
        meeting,
        roomName,
      );

      // Envoyer les invitations aux participants
      await this.emailService.sendUpdateNotification(
        oldMeeting,
        meeting,
        roomName,
      );

      // Envoyer les notifications aux participants retirés
      await this.emailService.sendRetiredAttendeesNotification(
        oldMeeting,
        meeting,
        roomName,
      );
      // Envoyer les notifications aux participants ajoutés
      await this.emailService.sendNewAttendeeInvitations(
        oldMeeting,
        meeting,
        roomName,
      );
    } catch (error) {
      console.error('Error sending meeting notifications:', error);
      throw error;
    }
  }
}
