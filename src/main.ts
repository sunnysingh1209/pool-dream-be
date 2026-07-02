import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exception/http-exception.filter';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { ConditionalTransformInterceptor } from './common/interceptor/ConditionalTransform.interceptor';
import { SwaggerModule } from '@nestjs/swagger';
import { createDocument } from './common/swagger/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ConditionalTransformInterceptor(reflector),
  );
  app.setGlobalPrefix('api/v1');
  SwaggerModule.setup('api', app, createDocument(app));
  await app.listen(process?.env?.PORT || 8080);
  console.log(`🚀 Server started at ${await app.getUrl()}`);
}
bootstrap();
