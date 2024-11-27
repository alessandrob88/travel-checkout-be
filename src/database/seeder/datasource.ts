import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

import { getTypeOrmConfig } from '../../config/database.config';

export const createDataSource = (): DataSource => {
  const environment = process.env.NODE_ENV || 'development';

  const envSuffixMap = {
    development: '.local',
    staging: '.staging',
    test: '.local',
  };

  const envSuffix = envSuffixMap[environment] || '';
  dotenv.config({ path: `.env${envSuffix}` });

  const configService = new ConfigService();

  const dataSource = new DataSource(
    getTypeOrmConfig(configService) as DataSourceOptions,
  );

  return dataSource;
};
