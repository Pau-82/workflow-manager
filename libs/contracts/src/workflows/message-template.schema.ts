import { z } from 'zod';

export const messageTemplateSchema = z.string().min(1).max(100);
