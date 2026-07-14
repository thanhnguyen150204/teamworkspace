import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt"
import { LoginDto } from "./dto/login.dto";
@Injectable()
export class AuthService{
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
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
        return result;
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
        const payload = {sub: user.id, email: user.email};
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
            },
        };
    }

}