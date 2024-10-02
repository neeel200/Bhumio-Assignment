import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import {ConfigService} from '@nestjs/config';

@Module({
    imports: [
        MailerModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
            transport: {
              host: configService.get('MAIL_HOST'),
              // For SSL and TLS connection
              secure: false,
              port: 587,
              auth: {
                // Account gmail address
                user: configService.get('MAIL_USER'),
                pass: configService.get('MAIL_PASS')
              },
            },
          }),
          inject: [ConfigService],
        }),
      ],
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }