import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
    message: string;
  
    constructor(message: string) {
      this.message = message;
    }
  }
  
