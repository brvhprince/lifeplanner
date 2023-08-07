import sendgrid from "@sendgrid/mail";
import { MailBody } from "../types";

export const sendSendGridMail = async (mailBody: MailBody) => {
	try {
		sendgrid.setApiKey(String(process.env.SENDGRID_API_KEY));

		const response = await sendgrid.send({
			from: `${process.env.SMTP_FROM}" <${process.env.SMTP_FROM_EMAIL}>`,
			to: mailBody.recipient,
			subject: mailBody.subject,
			html: mailBody.body
		});

		return response[0].statusCode < 206;
	} catch (e) {
		// TODO: error logging with sentry
		console.log({ e });
		return false;
	}
};
