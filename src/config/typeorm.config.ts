import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { getTypeOrmConfig } from './database.config';

config({ path: ['.env.local', '.env'] });

const configService = new ConfigService();

const isTestEnv = configService.get<string>('NODE_ENV') === 'test';
console.log('isTestEnv::', isTestEnv);

export default new DataSource({
  ...getTypeOrmConfig(configService),
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  database: configService.get<string>(isTestEnv ? 'DB_TEST_NAME' : 'DB_NAME'),
} as DataSourceOptions);
