import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockRequest: any;
  let mockResponse: any;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    mockRequest = {
      method: 'GET',
      originalUrl: '/workspaces/1/tasks',
      params: { workspaceId: '1' },
      body: { password: 'secret-password', title: 'Task Title' },
      headers: { 'x-request-id': 'req-999' },
      requestId: 'req-999',
    };
    mockResponse = {
      statusCode: 200,
    };
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'ok' })),
    };
  });

  it('should intercept and log successful HTTP requests', (done) => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      },
    });
  });

  it('should intercept and log error HTTP requests', (done) => {
    mockCallHandler.handle = jest.fn().mockReturnValue(
      throwError(() => ({ status: 400, message: 'Bad request error' })),
    );

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: () => {
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      },
    });
  });
});
