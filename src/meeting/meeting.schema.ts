import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Room } from '../room/room.schema';

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Meeting extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: true })
  start_date: Date;

  @Prop({ required: true })
  end_date: Date;

  @Prop({ type: [String], required: true })
  attendees: string[];

  @Prop({ required: true })
  organizer_full_name: string;

  @Prop({ required: true })
  organizer_email: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room', required: true })
  room: Room;

  @Prop({ enum: MeetingStatus, default: MeetingStatus.SCHEDULED })
  status: MeetingStatus;

  @Prop({ default: false })
  is_organizer_privileged: boolean;

  @Prop()
  cancelled_reason?: string;

  @Prop()
  cancelled_by?: string;

  @Prop()
  cancelled_at?: Date;

  @Prop({ required: true, unique: true })
  access_code: string;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
