import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClickStat } from './entities/click_stat.entity';
import { CreateClickStatDto } from './dto/create-click_stat.dto';
import { Campaign } from '../campaigns/entities/campaign.entity';

@Injectable()
export class ClickStatService {
  constructor(
    @InjectRepository(ClickStat)
    private clickStatRepository: Repository<ClickStat>,
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>
  ) { }

  async create(createClickStatDto: CreateClickStatDto) {
    const clickStat = new ClickStat();
    clickStat.link = createClickStatDto.link;
    clickStat.clickCount = createClickStatDto.clickCount || 0;

    if (createClickStatDto.campaignId) {
      const campaign = await this.campaignRepository.findOne({ where: { id: createClickStatDto.campaignId } });
      if (campaign) {
        clickStat.campaign = campaign;
      } else {
        throw new Error('Campaign not found');
      }
    } else {
      throw new Error('Campaign ID is required');
    }

    return this.clickStatRepository.save(clickStat);
  }

  findAll() {
    return this.clickStatRepository.find({ relations: ['campaign'] });
  }

  async incrementClickCount(id: string) {
    const clickStat = await this.clickStatRepository.findOne({ where: { id } });
    if (!clickStat) {
      throw new Error('ClickStat not found');
    }
    clickStat.clickCount += 1;
    return this.clickStatRepository.save(clickStat);
  }
}