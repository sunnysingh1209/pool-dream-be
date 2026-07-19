import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerOptions } from './common/logger/winston.config';
import { HttpExceptionFilter } from './common/exception/http-exception.filter';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { ConditionalTransformInterceptor } from './common/interceptor/ConditionalTransform.interceptor';
import { SwaggerModule } from '@nestjs/swagger';
import { createDocument } from './common/swagger/swagger';

// Comma-separated list, e.g. "https://app.example.com,https://staging.example.com".
// Falls back to reflecting any origin (no credentials) when unset, so local
// dev keeps working without extra setup.
const allowedOrigins = process.env.FRONTEND_URL?.split(',').map((o) => o.trim());

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: allowedOrigins
      ? { origin: allowedOrigins, credentials: true }
      : { origin: true, credentials: true },
    logger: WinstonModule.createLogger(winstonLoggerOptions),
  });
  app.use(cookieParser());
  app.use(
    helmet({
      // Swagger UI (served at /api) needs inline scripts/styles; a strict
      // default CSP would break it. Leaving CSP off since this is a JSON
      // API, not a page that renders untrusted content.
      contentSecurityPolicy: false,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ConditionalTransformInterceptor(reflector),
  );
  app.setGlobalPrefix('api/v1');

  const logger = new Logger('Bootstrap');
  // Swagger publicly documents (and lets anyone construct requests against)
  // every endpoint. Keep it out of production by default; ENABLE_SWAGGER=true
  // opts back in for staging environments that happen to run NODE_ENV=production.
  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';
  if (swaggerEnabled) {
    SwaggerModule.setup('api', app, createDocument(app));
  } else {
    logger.log('Swagger docs disabled (production). Set ENABLE_SWAGGER=true to override.');
  }

  await app.listen(process?.env?.PORT || 8080);
  logger.log(`🚀 Server started at ${await app.getUrl()}`);
}
bootstrap();
