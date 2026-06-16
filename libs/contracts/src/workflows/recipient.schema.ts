import { z } from 'zod';

export const emailRecipientSchema = z.object({
  channel: z.literal('email'),
  address: z.string().trim().email(),
});

export const inAppRecipientSchema = z.object({
  channel: z.literal('in-app'),
  target: z.string().trim().min(1),
});

export const recipientSchema = z.discriminatedUnion('channel', [
  emailRecipientSchema,
  inAppRecipientSchema,
]);
