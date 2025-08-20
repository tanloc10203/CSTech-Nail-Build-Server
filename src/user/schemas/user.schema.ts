import { Prop, Schema, SchemaFactory, Virtual } from '@nestjs/mongoose';
import { Service } from '@src/services/schemas/service.schema';
import mongoose from 'mongoose';

export const DOCUMENT_NAME = 'User';
const COLLECTION_NAME = 'Users';

export enum UserRoles {
  EMPLOYEE = 'employee',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({
  timestamps: true,
  collection: COLLECTION_NAME,
  toJSON: {
    virtuals: true,
  },
})
export class User extends mongoose.Document {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Virtual({
    get: function (this: User) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  fullName: string;

  @Prop({ default: null })
  username: string;

  @Prop({ default: null })
  salt: string;

  @Prop({ default: null })
  password: string;

  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  phone: string;

  @Prop({ default: null })
  address: string;

  @Prop({ default: null })
  avatar: string;

  @Prop({ default: null })
  dob: Date;

  @Prop({ default: 'employee', enum: ['employee', 'admin'] })
  role: UserRoles;

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status: UserStatus;

  @Prop({
    default: [],
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  })
  userSkills: Service[];
}

export const UserSchema = SchemaFactory.createForClass(User);
