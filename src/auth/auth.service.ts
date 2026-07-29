import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt"
import { LoginDto } from "./dto/login.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { RefreshTokenDto } from "./dto/refresh_token.dto";
@Injectable()
export class AuthService{
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) {}
    async register(registerDto: RegisterDto){
        const user = await this.usersService.findByEmail(registerDto.email);
        if(user){
            throw new ConflictException("User already exists");
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const createdUser = await this.usersService.create({
            fullName: registerDto.fullName,
            email: registerDto.email,
            password: hashedPassword,
        });
        const {password, ...result} = createdUser;
        const tokens = await this.generateTokens(createdUser.id, createdUser.email);
        return {
            ...tokens,
            user: result,
        };
    }

    async login(loginDto: LoginDto){
        const user = await this.usersService.findByEmail(loginDto.email);
        if(!user){
            throw new UnauthorizedException("Invalid credentials");
        }
        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if(!isMatch){
            throw new UnauthorizedException("Invalid credentials");
        }
        const {password, ...result} = user;
        const tokens = await this.generateTokens(user.id, user.email);
        return {
            ...tokens,
            user: result,
        };
    }
    async generateTokens(userId: number, email: string){
        const payload = {sub: userId, email};
        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign(payload,{
            secret: process.env.REFRESH_TOKEN_SECRET,
            expiresIn: '7d',
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate()+7);
        await this.prisma.refreshToken.create({
            data:{
                token: refresh_token,
                userId,
                expiresAt,
            },
        });
        return {access_token, refresh_token};
    }
    async refresh(refreshToken: RefreshTokenDto){
        let payload;
        try {
        payload = this.jwtService.verify(refreshToken.refresh_token, {
            secret: process.env.REFRESH_TOKEN_SECRET,
        });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where:{
                token: refreshToken.refresh_token,
            },
        });
        if(!tokenRecord) throw new UnauthorizedException('Token not found');
        if(tokenRecord.revoked){
            throw new UnauthorizedException('Token has been revoked');
        }
        if(tokenRecord.expiresAt < new Date()){
            throw new UnauthorizedException('Refresh token expired');
        }
        const access_token = this.jwtService.sign({
            sub: payload.sub,
            email: payload.email,
        });
        return {access_token};
    }
    async logout(refreshToken: RefreshTokenDto){
        const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
            where: {
                token: refreshToken.refresh_token,
            },
        });
        if(!refreshTokenRecord) throw new UnauthorizedException('Token not found');
        await this.prisma.refreshToken.update({
            where:{
                token: refreshToken.refresh_token,
            },
            data:{
                revoked: true,
            },
        });
        return {message: 'Logout successfully'};
    }
}