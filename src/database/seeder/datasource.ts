import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

import { getTypeOrmConfig } from '../../config/database.config';

export const createDataSource = (): DataSource => {
  const environment = process.env.NODE_ENV || 'development';

  const envSuffixMap = {
    development: '.local',
    staging: '.staging',
  };

  const envSuffix = envSuffixMap[environment] || '';
  dotenv.config({ path: `.env${envSuffix}` });

  const configService = new ConfigService();

  const typeOrmConfig = getTypeOrmConfig(configService) as DataSourceOptions;
  const dataSource = new DataSource(typeOrmConfig);

  return dataSource;
};
