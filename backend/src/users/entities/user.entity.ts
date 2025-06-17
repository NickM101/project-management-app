// user-response.dto.ts
import { UserRole } from '../../generated/prisma';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  is_active: boolean;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
