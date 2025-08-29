import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsEmail,
  IsMongoId,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMeetingDto {
  @ApiProperty({ description: 'Titre de la réunion' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description de la réunion' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: 'Date et heure de début (ISO string)',
    example: '2024-01-01T10:00:00.000Z',
  })
  @IsDateString()
  start_date: string;

  @ApiProperty({
    description: 'Date et heure de fin (ISO string)',
    example: '2024-01-01T11:00:00.000Z',
  })
  @IsDateString()
  end_date: string;

  @ApiProperty({ description: 'Liste des participants', type: [String] })
  @IsArray()
  @IsString({ each: true })
  attendees: string[];

  @ApiProperty({ description: "Nom complet de l'organisateur" })
  @IsString()
  @IsNotEmpty()
  organizer_full_name: string;

  @ApiProperty({ description: "Email de l'organisateur" })
  @IsEmail()
  @IsNotEmpty()
  organizer_email: string;

  @ApiProperty({ description: 'ID de la salle' })
  @IsMongoId()
  @IsNotEmpty()
  room: string;
}
