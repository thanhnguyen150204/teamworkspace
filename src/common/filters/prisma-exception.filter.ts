import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request & { requestId?: string }>();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Database operation failed';

        switch (exception.code) {
            case 'P2002':
                statusCode = HttpStatus.CONFLICT;
                message = 'Record already exists';
                break;
            case 'P2025':
                statusCode = HttpStatus.NOT_FOUND;
                message = 'Record not found'
                break;
            case 'P2003':
                statusCode = HttpStatus.BAD_REQUEST;
                message = 'Foreign key constraint failed or referenced record does not exist';
                break;
            case 'P2014':
                statusCode = HttpStatus.BAD_REQUEST;
                message = 'The change would violate the relation between models';
                break;
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