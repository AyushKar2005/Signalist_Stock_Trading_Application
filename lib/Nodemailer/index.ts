
import nodemailer from 'nodemailer'
import {WELCOME_EMAIL_TEMPLATE} from "@/lib/Nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
})

export const sendWelcome = async({email,name,intro}:WelcomeEmailData)=>{
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}',name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from:`"Signalist" <signalist@gmail.com>`,
        to:email,
        subject:`Welcome to Signalist - your stock market toolkit is ready!`,
        html:htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}
