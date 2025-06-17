import { UserRole } from '../../generated/prisma';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  profileImageId?: string; 
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  assignedProject?: any; 
  message?: string; 

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
