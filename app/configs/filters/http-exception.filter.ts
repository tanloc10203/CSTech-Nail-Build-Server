import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const details =
      exception instanceof HttpException
        ? exception.getResponse()?.['details']
        : null;

    const responseBody = {
      statusCode: httpStatus,
      message: exception instanceof Error ? exception.message : exception,
      details,
      code: exception?.['response']?.['code'] ?? null,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
