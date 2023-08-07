import Mailgun from "mailgun.js";
import formData from "form-data";
import { MailBody } from "../types";

export const sendMailgunMail = async (mailBody: MailBody) => {
	try {
		const mailgun = new Mailgun(formData);
		const mg = mailgun.client({
			username: "api",
			key: String(process.env.MAILGUN_API_KEY)
		});

		const response = await mg.messages.create(
			String(process.env.MAILGUN_DOMAIN),
			{
				from: `${process.env.SMTP_FROM}" <${process.env.SMTP_FROM_EMAIL}>`,
				to: mailBody.recipient,
				subject: mailBody.subject,
				html: mailBody.body
			}
		);

		return Boolean(response.id);
	} catch (e) {
		// TODO: error logging with sentry
		console.log({ e });
		return false;
	}
};
