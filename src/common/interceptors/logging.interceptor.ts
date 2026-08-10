import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { requestId?: string; user?: any }>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, params, body } = request;
    const requestId = request.requestId || (request.headers['x-request-id'] as string) || 'N/A';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;
          const userId = request.user?.id ?? 'Anonymous';
          const workspaceId = this.extractWorkspaceId(params, request.headers);

          this.logRequest({
            requestId,
            method,
            url: originalUrl,
            statusCode,
            responseTime,
            userId,
            workspaceId,
            body: this.sanitizePayload(body),
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;
          const userId = request.user?.id ?? 'Anonymous';
          const workspaceId = this.extractWorkspaceId(params, request.headers);

          this.logError({
            requestId,
            method,
            url: originalUrl,
            statusCode,
            responseTime,
            userId,
            workspaceId,
            error: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }

  private logRequest(data: {
    requestId: string;
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    userId: string | number;
    workspaceId: string | number | null;
    body: any;
  }) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // Format JSON for Production
      this.logger.log(JSON.stringify({ level: 'info', ...data }));
    } else {
      // Format easy read for Development
      const userStr = data.userId !== 'Anonymous' ? ` [User: ${data.userId}]` : '';
      const wsStr = data.workspaceId ? ` [Workspace: ${data.workspaceId}]` : '';
      this.logger.log(
        `[${data.requestId}] ${data.method} ${data.url} ${data.statusCode} - ${data.responseTime}ms${userStr}${wsStr}`,
      );
    }
  }

  private logError(data: {
    requestId: string;
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    userId: string | number;
    workspaceId: string | number | null;
    error: string;
    stack?: string;
  }) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      this.logger.error(JSON.stringify({ level: 'error', ...data }));
    } else {
      const userStr = data.userId !== 'Anonymous' ? ` [User: ${data.userId}]` : '';
      this.logger.error(
        `[${data.requestId}] ${data.method} ${data.url} ${data.statusCode} - ${data.responseTime}ms${userStr} - Error: ${data.error}`,
      );
    }
  }

  // Function filter password / token / file sensitive
  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;

    const sensitiveFields = ['password', 'confirmPassword', 'token', 'accessToken', 'refreshToken', 'secret'];
    const sanitized = { ...payload };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.includes(key)) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizePayload(sanitized[key]);
      }
    }
    return sanitized;
  }

  private extractWorkspaceId(params: any, headers: Record<string, any>): string | number | null {
    const raw = params?.workspaceId || headers?.['x-workspace-id'];
    if (Array.isArray(raw)) return raw[0] ?? null;
    if (typeof raw === 'string' || typeof raw === 'number') return raw;
    return null;
  }
}
