import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnlockRoomDto {
  @ApiProperty({ 
    description: 'Code d\'accès de la salle à déverrouiller',
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty()
  access_code: string;
}
