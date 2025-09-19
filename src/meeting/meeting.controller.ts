import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { CancelMeetingDto } from './dto/cancel-meeting.dto';
import { CancelByAccessCodeDto } from './dto/cancel-by-access-code.dto';
import { MeetingStatus } from './meeting.schema';

@ApiTags('meetings')
@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle réunion' })
  @ApiResponse({ status: 201, description: 'Réunion créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Conflit de planning' })
  create(@Body() createMeetingDto: CreateMeetingDto) {
    return this.meetingService.create(createMeetingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les réunions' })
  @ApiQuery({ name: 'room', required: false, description: 'Filtrer par salle' })
  @ApiQuery({
    name: 'organizer',
    required: false,
    description: 'Filtrer par organisateur (email)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MeetingStatus,
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Date de début pour filtrage (ISO string)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'Date de fin pour filtrage (ISO string)',
  })
  @ApiResponse({ status: 200, description: 'Liste des réunions' })
  findAll(
    @Query('room') room?: string,
    @Query('organizer') organizer?: string,
    @Query('status') status?: MeetingStatus,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    if (room) {
      return this.meetingService.findByRoom(room, status);
    }
    if (organizer) {
      return this.meetingService.findByOrganizer(organizer);
    }
    if (startDate && endDate) {
      return this.meetingService.findByDateRange(
        new Date(startDate),
        new Date(endDate),
      );
    }
    return this.meetingService.findAll();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Obtenir les prochaines réunions' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de réunions à retourner',
  })
  @ApiResponse({ status: 200, description: 'Liste des prochaines réunions' })
  getUpcoming(@Query('limit') limit?: number) {
    return this.meetingService.getUpcomingMeetings(
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  @Get('room-schedule/:roomId/:date')
  @ApiOperation({
    summary: "Obtenir le planning d'une salle pour une date donnée",
  })
  @ApiParam({ name: 'roomId', description: 'ID de la salle' })
  @ApiParam({ name: 'date', description: 'Date au format YYYY-MM-DD' })
  @ApiResponse({
    status: 200,
    description: 'Planning de la salle pour la date',
  })
  getRoomSchedule(
    @Param('roomId') roomId: string,
    @Param('date') date: string,
  ) {
    return this.meetingService.getRoomSchedule(roomId, new Date(date));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une réunion par ID' })
  @ApiResponse({ status: 200, description: 'Réunion trouvée' })
  @ApiResponse({ status: 404, description: 'Réunion non trouvée' })
  findOne(@Param('id') id: string) {
    return this.meetingService.findOne(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Annuler une réunion par ID' })
  @ApiResponse({ status: 200, description: 'Réunion annulée avec succès' })
  @ApiResponse({ status: 404, description: 'Réunion non trouvée' })
  @ApiResponse({ status: 400, description: 'Réunion ne peut pas être annulée' })
  cancel(@Param('id') id: string, @Body() cancelMeetingDto: CancelMeetingDto) {
    return this.meetingService.cancel(id, cancelMeetingDto);
  }

  @Post('cancel-by-code')
  @ApiOperation({ summary: "Annuler une réunion avec le code d'accès" })
  @ApiResponse({ status: 200, description: 'Réunion annulée avec succès' })
  @ApiResponse({
    status: 404,
    description: "Aucune réunion trouvée avec ce code d'accès",
  })
  @ApiResponse({ status: 400, description: 'Réunion ne peut pas être annulée' })
  cancelByAccessCode(@Body() cancelByAccessCodeDto: CancelByAccessCodeDto) {
    return this.meetingService.cancelByAccessCode(cancelByAccessCodeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une réunion' })
  @ApiResponse({ status: 200, description: 'Réunion supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Réunion non trouvée' })
  remove(@Param('id') id: string) {
    return this.meetingService.remove(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une réunion' })
  @ApiResponse({ status: 200, description: 'Réunion modifiée avec succès' })
  @ApiResponse({ status: 404, description: 'Réunion non trouvée' })
  update(@Param('id') id: string, @Body() createMeetingDto: CreateMeetingDto) {
    return this.meetingService.update(id, createMeetingDto);
  }

  @Get('/by-access-code/:accessCode')
  @ApiOperation({ summary: 'Obtenir une réunion par code d’accès' })
  @ApiResponse({ status: 200, description: 'Réunion trouvée' })
  @ApiResponse({ status: 404, description: 'Réunion non trouvée' })
  getByAccessCode(@Param('accessCode') accessCode: string) {
    return this.meetingService.getByAccessCode(accessCode);
  }
}
