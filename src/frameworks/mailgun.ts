import Mailgun from 'mailgun.js'
import formData  from 'form-data'
import { MailBody } from '../types'

const mailgun = new Mailgun(formData)
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY as string})

export const sendMailgunMail = async (mailBoody: MailBody) => {
    const response = await mg.messages.create(String(process.env.MAILGUN_DOMAIN), {
        from: `${process.env.SMTP_FROM}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: mailBoody.recipient,
        subject: mailBoody.subject,
        html: mailBoody.body
})

return Boolean(response.id)
}
