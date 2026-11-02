import dotenv from "dotenv";

type ServerConfig = {
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    HOTEL_SERVICE_URL: string;
    BOOKING_SERVICE_URL: string;
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
    JWT_SECRET: process.env.JWT_SECRET!,
    HOTEL_SERVICE_URL: process.env.HOTEL_SERVICE_URL!,
    BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL!,
};
