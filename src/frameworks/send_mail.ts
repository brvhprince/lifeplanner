import { MailCompose, MailTransporter, MailBody } from "../types"

export default function makeSendMail ({ Transporter, fs }: {Transporter: MailTransporter, fs: any}) {
    return async function sendMail ({ template: mailTemplate, variables, email, subject}: MailCompose) {
        try {

            let template = fs.readFileSync(`${__dirname}/templates/${mailTemplate}.html`,{encoding:'utf-8'})

            for (const [key, value] of Object.entries(variables)) {
                template = template.replace(`{{ ${key} }}`, value.toString())
            }

            const mailBody: MailBody = {
                recipient: email,
                subject,
                body: template

            }
              return await Transporter(mailBody)
        }
        catch (e) {
            //TODO: handle error logging with sentry
            console.log(e)
            return false
        }
    }
}