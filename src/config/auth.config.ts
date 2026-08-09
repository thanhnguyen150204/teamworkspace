import { registerAs } from "@nestjs/config";

export default registerAs('auth', () => ({
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION,
}));