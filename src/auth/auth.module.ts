import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from '@nestjs/passport';
import { TokenService } from './token.service';
import { RefreshTokenService } from './refresh-token.service';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'secretKey',
            signOptions: { 
                expiresIn: '15m',
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, TokenService, RefreshTokenService],
    exports: [AuthService, TokenService, RefreshTokenService],
})
export class AuthModule {}
