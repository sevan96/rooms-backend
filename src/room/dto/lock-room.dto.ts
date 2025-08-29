import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockRoomDto {
  @ApiProperty({ 
    description: 'Code d\'accès de la salle à verrouiller',
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty()
  access_code: string;
}
