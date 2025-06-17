import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { UserRole } from 'src/auth/user-role';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthenticatedUser } from 'src/auth/interfaces/jwt.interface';
import { FileUploadInterceptor } from 'src/common/interceptors/file-upload.interceptor';
import { multerOptions } from 'src/config/multer.config';
import { UploadImageResponseDto } from './dto/upload-image.dto';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('active') active?: string,
    @Query('role') role?: UserRole,
    @Query('withoutProject') withoutProject?: string,
  ): Promise<UserResponseDto[]> {
    if (withoutProject === 'true') {
      return this.usersService.findUsersWithoutProject();
    }

    if (role === UserRole.ADMIN || role === UserRole.USER) {
      return this.usersService.findUserByRole(role);
    }

    if (active === 'true') {
      return this.usersService.findActiveUsers();
    }

    return this.usersService.findAllUsers();
  }

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    return this.usersService.findOneUser(userId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOneUser(id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const { role, ...userUpdate } = updateUserDto;
    return this.usersService.updateUser(userId, userUpdate);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.usersService.changeUserPassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Post(':id/change-password')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async changeUserPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.usersService.changeUserPassword(id, dto.currentPassword, dto.newPassword);
  }

  @Post(':userId/assign-project/:projectId')
  @Roles(UserRole.ADMIN)
  async assignProject(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.assignUserProject(userId, projectId);
  }

  @Delete(':userId/unassign-project')
  @Roles(UserRole.ADMIN)
  async unassignProject(@Param('userId', ParseUUIDPipe) userId: string): Promise<UserResponseDto> {
    return this.usersService.unassignUserProject(userId);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<MessageResponseDto> {
    return this.usersService.deactivateUser(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<MessageResponseDto> {
    return this.usersService.deleteUser(id);
  }

  @Post('profile-image')
  @UseInterceptors(
    FileInterceptor('image', multerOptions),
    FileUploadInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
      required: ['image'],
    },
  })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UploadImageResponseDto> {
    try {
      const currentUser = await this.usersService.findOneUser(user.id);

      const uploadResult = currentUser.profileImageId
        ? await this.cloudinaryService.updateImage(file, currentUser.profileImageId, 'profiles')
        : await this.cloudinaryService.uploadImage(
            file,
            'profiles',
            `profile_${user.id}_${Date.now()}`,
          );

      await this.usersService.updateProfileImage(user.id, {
        profileImageId: uploadResult.public_id,
        profileImageUrl: uploadResult.secure_url,
      });

      return new UploadImageResponseDto(uploadResult);
    } catch (error) {
      throw new BadRequestException(`Profile image upload failed: ${error.message}`);
    }
  }

  @Delete('profile-image')
  async deleteProfileImage(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    try {
      const currentUser = await this.usersService.findOneUser(user.id);

      if (!currentUser.profileImageId) {
        throw new BadRequestException('No profile image to delete');
      }

      await this.cloudinaryService.deleteImage(currentUser.profileImageId);

      await this.usersService.updateProfileImage(user.id, {
        profileImageId: null,
        profileImageUrl: null,
      });

      return { message: 'Profile image deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Failed to delete profile image: ${error.message}`);
    }
  }
}
