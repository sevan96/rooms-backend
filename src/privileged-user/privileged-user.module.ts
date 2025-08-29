import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrivilegedUserService } from './privileged-user.service';
import { PrivilegedUserController } from './privileged-user.controller';
import { PrivilegedUser, PrivilegedUserSchema } from './privileged-user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: PrivilegedUser.name, schema: PrivilegedUserSchema }])],
  controllers: [PrivilegedUserController],
  providers: [PrivilegedUserService],
  exports: [PrivilegedUserService],
})
export class PrivilegedUserModule {}
