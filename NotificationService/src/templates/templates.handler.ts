import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import type { NotificationDTO } from "../dtos/notification.dto.js";

// Load and render the requested email template.
export async function renderMailTemplate(
    templateId: string,
    params: NotificationDTO["params"],
) {
    // Templates are stored in src/templates/mailer.
    const templatePath = path.resolve(
        process.cwd(),
        "src",
        "templates",
        "mailer",
        `${templateId}.hbs`,
    );

    const templateContent = await fs.readFile(templatePath, "utf-8");
    const compiledTemplate = Handlebars.compile(templateContent);

    return compiledTemplate(params);
}
