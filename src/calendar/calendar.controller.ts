import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('ics/:meetingId')
  @ApiOperation({
    summary: 'Télécharger un fichier ICS pour une réunion',
    description:
      'Génère et télécharge un fichier ICS pour ajouter la réunion à un calendrier',
  })
  @ApiParam({
    name: 'meetingId',
    description: 'Identifiant unique de la réunion',
  })
  async downloadICS(
    @Param('meetingId') meetingId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const icsContent =
        await this.calendarService.generateICSForMeeting(meetingId);

      res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="reunion-${meetingId}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      });

      res.send(icsContent);
    } catch (error) {
      throw new NotFoundException(
        'Réunion non trouvée ou impossible de générer le fichier ICS',
      );
    }
  }
}
