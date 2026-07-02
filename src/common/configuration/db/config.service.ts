import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmPostgresConnectionService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {
    console.log('DATABASE_HOST', process.env.DATABASE_HOST);
  }

  createTypeOrmOptions(
    connectionName?: string | undefined,
  ): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
    return {
      type: 'postgres',
      host: this.configService.get<string>('DATABASE_HOST'),
      port: parseInt(this.configService.get<string>('DATABASE_PORT') || '5432'),
      username: this.configService.get<string>('DATABASE_USERNAME'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      database: this.configService.get<string>('DATABASE_NAME'),
      entities: ['dist/entities/*.entity{.ts,.js}'],
      migrations: ['dist/migrations/*{.ts,.js}'],
      migrationsTableName: 'tour_migrations',
      autoLoadEntities: false,
      synchronize: false,
      logging: true,
      logger: 'file',
      //Uncomment this line while delpoyement
      // ssl: Boolean(this.configService.get<string>('SSL')) ?? false,
    };
  }
}
