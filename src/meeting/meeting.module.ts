import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { Meeting, MeetingSchema } from './meeting.schema';
import { PrivilegedUserModule } from '../privileged-user/privileged-user.module';
import { RoomModule } from '../room/room.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meeting.name, schema: MeetingSchema }]),
    PrivilegedUserModule,
    RoomModule,
    EmailModule,
  ],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule {}
