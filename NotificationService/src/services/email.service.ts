import "dotenv/config";
import nodemailer from "nodemailer";

const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail(to: string, subject: string, html: string) {
    await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    });
}
