import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from './transform.interceptor';

export class ConditionalTransformInterceptor implements NestInterceptor {
  private readonly transform = new TransformInterceptor();

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const bypass = this.reflector.get<boolean>('bypassTransform', context.getHandler());

    if (bypass) {
      //  Skip transformation for this route
      return next.handle();
    }

    //  Otherwise, let your existing TransformInterceptor do its job
    return this.transform.intercept(context, next);
  }
}
