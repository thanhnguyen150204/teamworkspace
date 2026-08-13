import { Module } from '@nestjs/common';
import { ProjectGateway } from './project.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule, // provides ConfigService
    JwtModule,    // provides JwtService (secret picked up from auth.config via ConfigService)
  ],
  providers: [ProjectGateway],
  exports: [ProjectGateway],
})
export class GatewayModule {}