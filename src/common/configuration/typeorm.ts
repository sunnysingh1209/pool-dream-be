import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.env' });

console.log('DATABASE_HOST', process.env.DATABASE_HOST);
const config = {
  type: 'postgres',
  host: `${process.env.DATABASE_HOST}`,
  port: `${process.env.DATABASE_PORT}`,
  // port: parseInt(process.env.DATABASE_PORT, 10),
  username: `${process.env.DATABASE_USERNAME}`,
  password: `${process.env.DATABASE_PASSWORD}`,
  database: `${process.env.DATABASE_NAME}`,
  entities: ['dist/entities/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  synchronize: false,
  native: true,
// Uncomment this line while delpoyement
  // ssl: process.env?.SSL ?? false,
};

export const typeormConfig = registerAs('typeorm', () => config);
// console.log('FINAL TYPEORM CONFIG:', config);
export default new DataSource(config as DataSourceOptions);
