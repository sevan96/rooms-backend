import { PartialType } from '@nestjs/swagger';
import { CreatePrivilegedUserDto } from './create-privileged-user.dto';

export class UpdatePrivilegedUserDto extends PartialType(CreatePrivilegedUserDto) {}
