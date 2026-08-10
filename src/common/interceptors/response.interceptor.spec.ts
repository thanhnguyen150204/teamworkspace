import { ResponseInterceptor } from './response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockResponse = {
      statusCode: 200,
    };
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as any;
  });

  it('should wrap response data in unified standard format', (done) => {
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ id: 1, name: 'Test' })),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          statusCode: 200,
          data: { id: 1, name: 'Test' },
          timestamp: expect.any(String),
        });
        done();
      },
    });
  });

  it('should fallback data to empty object when response data is undefined or null', (done) => {
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(undefined)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          statusCode: 200,
          data: {},
          timestamp: expect.any(String),
        });
        done();
      },
    });
  });
});
