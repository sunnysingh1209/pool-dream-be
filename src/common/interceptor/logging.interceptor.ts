import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${method} ${originalUrl} ${response.statusCode} +${Date.now() - start}ms`,
          );
        },
        error: (err) => {
          // response.statusCode isn't finalized yet here — the exception
          // filter sets it after this fires — so it's omitted to avoid
          // logging a misleading 200.
          this.logger.error(
            `${method} ${originalUrl} +${Date.now() - start}ms - ${err.message}`,
          );
        },
      }),
    );
  }
}
