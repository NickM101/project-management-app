import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const getMailerConfig = (configService: ConfigService): MailerOptions => ({
  transport: {
    host: configService.get<string>('SMTP_HOST'),
    port: configService.get<number>('SMTP_PORT'),
    secure: configService.get<boolean>('SMTP_SECURE'), // true for 465, false for other ports
    auth: {
      user: configService.get<string>('SMTP_USER'),
      pass: configService.get<string>('SMTP_PASS'),
    },
  },
  defaults: {
    from: `"${configService.get<string>('APP_NAME')}" <${configService.get<string>('SMTP_FROM')}>`,
  },
  template: {
    dir: join(__dirname, '..', 'templates', 'emails'),
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
});