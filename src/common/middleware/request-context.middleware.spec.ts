import { RequestContextMiddleware, RequestWithContext } from './request-context.middleware';
import { Response } from 'express';

describe('RequestContextMiddleware', () => {
  let middleware: RequestContextMiddleware;
  let mockRequest: Partial<RequestWithContext>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new RequestContextMiddleware();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should generate a new requestId if none provided in headers', () => {
    middleware.use(mockRequest as RequestWithContext, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toBeDefined();
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-Id', mockRequest.requestId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should preserve x-request-id header if present', () => {
    mockRequest.headers = { 'x-request-id': 'custom-id-123' };

    middleware.use(mockRequest as RequestWithContext, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toBe('custom-id-123');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-Id', 'custom-id-123');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should preserve x-correlation-id header if x-request-id is missing', () => {
    mockRequest.headers = { 'x-correlation-id': 'corr-id-456' };

    middleware.use(mockRequest as RequestWithContext, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toBe('corr-id-456');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-Id', 'corr-id-456');
    expect(mockNext).toHaveBeenCalled();
  });
});
