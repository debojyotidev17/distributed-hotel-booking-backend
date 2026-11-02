import dotenv from "dotenv";

type ServerConfig = {
    PORT: number;
    DATABASE_URL: string;
    REDIS_PORT: number;
    REDIS_HOST: string;
};

dotenv.config();

/*
 * So after dotenv.config():
 *
 * PORT=3000
 * DATABASE_URL=...
 *
 * becomes accessible as:
 *
 * process.env.PORT
 * process.env.DATABASE_URL
 */

export const serverConfig: ServerConfig = {
    PORT: Number(process.env.PORT!),
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_PORT: Number(process.env.REDIS_PORT!),
    REDIS_HOST: process.env.REDIS_HOST!,
};