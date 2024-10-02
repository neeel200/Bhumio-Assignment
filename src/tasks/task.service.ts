import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from '../email/email.service';
import { InjectRepository, } from '@nestjs/typeorm';
import { Repository } from 'typeorm'
import * as Parser from 'rss-parser';
import { RssEntry } from "src/campaigns/entities/rssEntries.entity"
import { Subscriber } from 'src/subscribers/entities/subscriber.entity';

@Injectable()
export class TasksService {
    private parser: Parser = new Parser();

    constructor(
        private readonly mailService: EmailService,
        @InjectRepository(Subscriber)
        private readonly subscriberRepo: Repository<Subscriber>,
        @InjectRepository(RssEntry) private readonly rssEntryRepository: Repository<RssEntry>
    ) { }

    private readonly logger = new Logger(TasksService.name);

    @Cron('0 8 * * *') // Every day at 8 AM
    async handleCron() {
        this.logger.debug('Cron job started: Fetching RSS feeds and sending emails');

        // RSS feeds to fetch
        const rssFeeds = [
            'https://reddit.com/.rss',
            'https://gamerant.com/feed/'
        ];

        // Fetch new content from the RSS feeds
        const newEntries = await this.fetchNewContentFromRssFeed(rssFeeds);

        // Filter new entries
        const todayEntries = await this.filterEntriesByToday(newEntries);

        // Fetch all subscribers 
        const subscribers = await this.fetchSubscribers();

        // Send emails to all subscribers with today's filtered content
        for (const subscriber of subscribers) {

            await this.mailService.sendEmail(
                subscriber.email,
                `New updates for today `,
                `Today's content: ${todayEntries.map(entry => entry.link).join(', ')}`
            );
        }
    }

    async fetchNewContentFromRssFeed(rssFeeds: string[]) {

        // fetch the RSS feeds and aggregate them and return them
        const allEntries: any[] = [];

        for (const rssUrl of rssFeeds) {
            try {
                const feed = await this.parser.parseURL(rssUrl);
                allEntries.push(...feed.items);
                this.logger.debug(`Fetched ${feed.items.length} entries from ${rssUrl}`);
            } catch (error) {
                this.logger.error(`Error fetching RSS feed from ${rssUrl}: ${error.message}`);
            }
        }

        return allEntries;
    }

    private async filterEntriesByToday(items: any[]): Promise<any[]> {

        // Fetch existing entries from the database
        const existingEntries = await this.rssEntryRepository.find();
        const existingLinks = new Set(existingEntries.map(entry =>  entry.link )); // Create a set of existing links

        // Filter out new entries
        const newEntries = items.filter(item => !existingLinks.has(item.link));

        // Store new entries in the database
        await Promise.all(
            newEntries.map(async entry => {
                const newEntry = this.rssEntryRepository.create({
                    title: entry.title,
                    link: entry.link
                });
                await this.rssEntryRepository.save(newEntry);
            })
        );

        return newEntries;
    }

    private async fetchSubscribers(): Promise<Subscriber[]> {
        return await this.subscriberRepo.find();
    }
}


