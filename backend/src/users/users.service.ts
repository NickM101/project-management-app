import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../../generated/prisma'; 
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { MessageResponseDto } from '../common/dto/message-response.dto';

@Injectable()
export class UsersService {
  private readonly saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);

  constructor(private readonly prisma: PrismaService) {}

  // ========== CREATE ==========
  async createUser(data: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictException(`User with email ${data.email} already exists`);
    }

    const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || UserRole.USER,
        isActive: data.isActive ?? true,
        profileImageId: data.profileImageId ?? '',
        profileImageUrl: data.profileImageUrl ?? '',
      },
      include: { assignedProject: true },
    });

    return this.toResponseDto(user);
  }

  // ========== FIND ==========
  async findOneUser(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { assignedProject: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.toResponseDto(user);
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({ include: { assignedProject: true } });
    return users.map(this.toResponseDto);
  }

  async findUsersWithoutProject(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: { assignedProject: null },
      include: { assignedProject: true },
    });
    return users.map(this.toResponseDto);
  }

  async findUserByRole(role: UserRole): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: { role },
      include: { assignedProject: true },
    });
    return users.map(this.toResponseDto);
  }

  async findActiveUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      include: { assignedProject: true },
    });
    return users.map(this.toResponseDto);
  }

  // ========== PASSWORD ==========
  async getUserWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async changeUserPassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<MessageResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const hashed = await bcrypt.hash(newPassword, this.saltRounds);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    return new MessageResponseDto('Password changed successfully');
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { assignedProject: true },
    });
    return this.toResponseDto(user);
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }

  async updateProfileImage(
    id: string,
    image: { profileImage: string | null; profileImageId: string | null },
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        profileImageUrl: image.profileImage,
        profileImageId: image.profileImageId,
      },
      include: { assignedProject: true },
    });
    return this.toResponseDto(user);
  }

  // ========== PROJECT ASSIGNMENT ==========
  async assignUserProject(userId: string, projectId: string): Promise<UserResponseDto> {
    // Since User model has no projectId, update Project.assignedUserId instead
    await this.prisma.project.update({
      where: { id: projectId },
      data: { assignedUserId: userId },
    });
    return this.findOneUser(userId);
  }

  async unassignUserProject(userId: string): Promise<UserResponseDto> {
    // Since User model has no projectId, update Project.assignedUserId instead
    await this.prisma.project.updateMany({
      where: { assignedUserId: userId },
      data: { assignedUserId: null },
    });
    return this.findOneUser(userId);
  }


  async deactivateUser(id: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'User deactivated successfully' };
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  // ========== HELPER ==========
  private toResponseDto(user: any): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      assignedProject: user.assignedProject ?? null,
      profileImage:  user.profileImage ?? '',
    });
  }
}
