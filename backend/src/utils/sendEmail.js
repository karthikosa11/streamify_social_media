import nodemailer from "nodemailer";

export const sendEmail = async (options) => {
    try {
        // Validate required environment variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("Email configuration missing: EMAIL_USER and EMAIL_PASS are required");
        }

        // Validate required options
        if (!options.to || !options.subject) {
            throw new Error("Email options missing: 'to' and 'subject' are required");
        }

        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        console.log(`Sending email to: ${options.to}, Subject: ${options.subject}`);
        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to: ${options.to}, Message ID: ${result.messageId}`);
        return result;
    } catch (error) {
        console.error("Error in sendEmail function:", {
            error: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response
        });
        throw error;
    }
}