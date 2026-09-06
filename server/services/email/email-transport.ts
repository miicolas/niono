export type EmailMessage = { to: string; subject: string; text: string };
export type EmailTransport = { send(message: EmailMessage): Promise<void> };
