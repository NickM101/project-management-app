// src/config/prisma.config.ts
import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPrismaClient = () => prisma;

@Module({
  providers: [{ provide: PrismaClient, useValue: prisma }],
  exports: [PrismaClient],
})
export class PrismaModule {}
