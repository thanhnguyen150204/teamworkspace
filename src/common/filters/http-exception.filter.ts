import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
    } else if ((exception as any)?.code === 'P2002') {
      statusCode = HttpStatus.CONFLICT;
      message = 'Email or record already exists';
    } else {
      console.error('Unhandled Exception:', exception);
    }

    const requestId =
      request.requestId || (request.headers?.['x-request-id'] as string);

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
