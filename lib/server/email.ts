import 'server-only'

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST ?? 'localhost',
  port: Number(process.env.EMAIL_PORT ?? 587),
  auth:
    process.env.EMAIL_USER
      ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      : undefined,
})

export async function sendFeedbackEmail(
  to: string,
  studentName: string,
  courseName: string,
  feedback: string,
): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? `"EduFlow" <noreply@eduflow.dev>`,
    to,
    subject: `Feedback on your homework — ${courseName}`,
    text: `Hi ${studentName},\n\nYour instructor has reviewed your homework submission for "${courseName}".\n\nFeedback:\n${feedback}\n\n— EduFlow`,
    html: `<p>Hi ${studentName},</p><p>Your instructor has reviewed your homework submission for <strong>${courseName}</strong>.</p><blockquote>${feedback.replace(/\n/g, '<br>')}</blockquote><p>— EduFlow</p>`,
  })
}
