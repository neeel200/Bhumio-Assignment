import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateClickStatDto } from './dto/create-click_stat.dto';
import { ClickStatService } from './click_stats.service';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/role.decorator';

@Controller('click-stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClickStatController {
  constructor(private readonly clickStatService: ClickStatService) { }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createClickStatDto: CreateClickStatDto) {
    return this.clickStatService.create(createClickStatDto);
  }

  @Get()
  findAll() {
    return this.clickStatService.findAll();
  }
}