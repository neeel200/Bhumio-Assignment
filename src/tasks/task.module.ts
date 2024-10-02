import { Module } from '@nestjs/common';
import { TasksService } from './task.service';
import { EmailService } from '../email/email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriber } from 'src/subscribers/entities/subscriber.entity';
import { RssEntry } from 'src/campaigns/entities/rssEntries.entity';
@Module({ 
    imports:[TypeOrmModule.forFeature([Subscriber, RssEntry])],
    providers: [TasksService, EmailService],
})
export class TasksModule { }