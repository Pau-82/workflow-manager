import { z } from 'zod';

export const comparisonOperatorSchema = z.enum([
  '>',
  '<',
  '>=',
  '<=',
  '==',
  '!=',
]);
