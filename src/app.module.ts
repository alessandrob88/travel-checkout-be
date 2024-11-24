import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TravelModule } from './domains/travel/travel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.development', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    TravelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
