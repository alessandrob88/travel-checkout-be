import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelService } from './travel.service';
import { TravelResolver } from './travel.resolver';
import { Travel } from './entities/travel.entity';
import { Mood } from './entities/mood.entity';
import { TravelValidator } from './travel.validator';

@Module({
  imports: [TypeOrmModule.forFeature([Travel, Mood])],
  providers: [TravelService, TravelResolver, TravelValidator],
})
export class TravelModule {}
