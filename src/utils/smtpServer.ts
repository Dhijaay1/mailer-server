import { rejects } from "assert";
import nodemailer, { Transporter } from "nodemailer";
import { wss } from "../../app";

export const sendWebSocketMessage = (message: any, origin: string) => {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({ message, origin }));
  });
};

export type EmailConfigProps = {
  email: string;
  password: string;
  subject: string;
  content: string;
  greetings: string;
  origin:string;
  body: {
    senderFirstName: string;
    senderLastName: string;
    recipientFirstName: string;
    recipientLastName: string;
    recipientEmail: string;
  }[];
};

export type EmailResponse = {
  success: boolean;
  data: nodemailer.SentMessageInfo[];
};

export const emailServer = async (
  config: EmailConfigProps
): Promise<EmailResponse> => {
  try {
    const transporter: Transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: `${config.email}`,
        pass: `${config.password}`,
      },
      tls: {
        minVersion: "TLSv1.2",
      },
      debug: true,
    });

    const sentEmails: nodemailer.SentMessageInfo[] = [];

    for (const emailBody of config.body) {
      if (
        typeof emailBody.recipientEmail !== "string" ||
        emailBody.recipientEmail.trim() === "" ||
        !emailBody.recipientEmail.includes("@")
      ) {
        throw new Error(
          `invalid format detected for the provided credential: ${emailBody.recipientEmail} or ${emailBody.recipientFirstName}. Please ensure they are in the correct format.`
        );
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: `<i***@gmail.com> ${emailBody.senderFirstName} ${emailBody.senderLastName}`,
        to: emailBody.recipientEmail,
        subject: config.subject,
        text: `Hello ${emailBody.recipientFirstName},\n\n${config.content}\n\n\n ${config.greetings}`,
      };

      // Create a promise that resolves after 3 seconds
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      // Send email after waiting for 3 seconds
      await delay(3000);

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);

      sendWebSocketMessage(info.envelope, config.origin);

      sentEmails.push(info);
    }

    return {
      success: true,
      data: sentEmails,
    };
  } catch (error) {
    throw error;
  }
};
