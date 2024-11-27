import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isTestEnv = configService.get<string>('NODE_ENV') === 'test';
  console.log('isTestEnv::', isTestEnv);

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASS'),
    database: configService.get<string>(isTestEnv ? 'DB_TEST_NAME' : 'DB_NAME'),
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    synchronize: configService.get<boolean>('DB_SYNC', false),
  };
};
