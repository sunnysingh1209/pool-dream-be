import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const formatMessage = (errors: []) => {
  const formattedError: any = [];
  if (errors.length > 0) {
    errors.map((el) => {
      const t = {};
      const key = 'constraints';
      const alKey = Object.keys(el['constraints'])[0];
      const msg = el[key][alKey];
      t[el['property']] = msg;
      formattedError.push(t);
    });
  }
  return formattedError;
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const msg = exception.message ?? 'Data Not Found';
    const errorData = Object.create({ errors: [] });
    try {
      if (exception && typeof exception.getResponse === 'function') {
        Object.assign(errorData, exception.getResponse());
      }
    } catch (error) { }

    const body = {
      statusCode: status,
      message: msg,
      errors: errorData.message || [],
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} ${status} - ${msg}`, exception.stack);
    } else {
      this.logger.warn(`${request.method} ${request.url} ${status} - ${msg}`);
    }

    response.status(status).json(body);
  }
}
