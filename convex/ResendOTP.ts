import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15, // 15 minutes
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    return generateRandomString(random, "0123456789", 8);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Bence's Residencies Tool <noreply@ise.bence.red>",
      to: [email],
      subject: "Your sign-in code for ise.bence.red",
      text: `Your verification code is: ${token}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
    });

    if (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
