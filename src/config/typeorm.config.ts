import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { getTypeOrmConfig } from './database.config';

config({ path: ['.env.development.local', '.env.development', '.env'] });

const configService = new ConfigService();

export default new DataSource(
  getTypeOrmConfig(configService) as DataSourceOptions,
);
