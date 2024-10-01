import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from '../email/email.service';
import { InjectRepository, } from '@nestjs/typeorm';
import { Repository } from 'typeorm'
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import Parser from "rss-parser"
import { RssEntry } from "src/campaigns/entities/rssEntries.entity"
@Injectable()
export class TasksService {
    private parser : Parser = new Parser();

    constructor(
        private readonly mailService: EmailService,
        @InjectRepository(Campaign)
        private readonly campaignRepo: Repository<Campaign>,
        @InjectRepository(Organization) private readonly organizationRepo: Repository<Organization>,
        @InjectRepository(RssEntry) private readonly rssEntryRepository: Repository<RssEntry>
    ) { }
    
    private readonly logger = new Logger(TasksService.name);

    @Cron('0 1-6 * * *')
    async handleCron() {
        this.logger.debug('Called every day');

        //fetch RSS campaigns from campaignRepository
        const rssCampaign = await this.campaignRepo.findOne({
            where: { subject: "RSS CAMPAIGN" },
            relations: ["organization"],
        })
        if (!rssCampaign) {
            this.logger.warn("No RSS CAMPAIGN found !");
        }

        //get the org related to this campaign
        const organization = rssCampaign.organization;

        //dummy rss feeds for now 
        const rssFeeds = [
            'https://example.com/rss-feed', 
            'https://another-example.com/rss'
        ];

        //fetch the rss feed 
        const newContent = await this.fetchNewContentFromRssFeed(rssFeeds);

        //get subs from the orgs

        const subscribers = await this.organizationRepo.createQueryBuilder("organization")
            .relation(Organization, "subscribers")
            .of(organization.id)
            .loadMany();

        //send email to all subscribers with new content
        for (const subscriber of subscribers) {
            await this.mailService.sendEmail(
                subscriber.email,
                `New updates from ${organization.name}`,
                `New content available: ${newContent}`
            )
        }
    }

    async fetchNewContentFromRssFeed(rssFeeds: string[]) {

        for (const rssUrl of rssFeeds) {
            try {
                const feed = await this.parser.parseURL(rssUrl);
                const newEntries = await this.checkForNewEntries(feed.items);

                if (newEntries.length > 0) {
                    this.logger.debug(`Found ${newEntries.length} new entries in ${rssUrl}`);
                    // Process new entries, e.g., send emails to subscribers
                } else {
                    this.logger.debug(`No new entries in ${rssUrl}`);
                }
            } catch (error) {
                this.logger.error(`Error fetching RSS feed from ${rssUrl}: ${error.message}`);
            }
        }
    }


    private async checkForNewEntries(items: any[]): Promise<any[]> {
        // Fetch existing entries from the database
        const existingEntries = await this.rssEntryRepository.find();
        const existingLinks = new Set(existingEntries.map(entry => entry.link)); // Create a set of existing links

        // Filter out new entries
        const newEntries = items.filter(item => !existingLinks.has(item.link));

        // Store new entries in the database
        await Promise.all(
            newEntries.map(async entry => {
                const newEntry = this.rssEntryRepository.create({
                    title: entry.title,
                    link: entry.link
                });
                await this.rssEntryRepository.save(newEntry); // Save new entry to the database
            })
        );

        return newEntries; // Return new entries to process further
    }
}