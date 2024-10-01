import { Module } from '@nestjs/common';
import { TasksService } from './task.service';
import { EmailService } from '../email/email.service';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
// import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { RssEntry } from "src/campaigns/entities/rssEntries.entity"
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
    imports:[TypeOrmModule.forFeature([Campaign, Organization, RssEntry])],
    providers: [TasksService, EmailService],
})
export class TasksModule { }