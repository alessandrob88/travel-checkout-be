import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { getTypeOrmConfig } from './database.config';

config({ path: ['.env.local', '.env'] });

const configService = new ConfigService();

export default new DataSource({
  ...getTypeOrmConfig(configService),
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
} as DataSourceOptions);
