import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'MessageTemplate';

export const MESSAGE_TEMPLATE_ERRORS = {
  EMPTY: 'MESSAGE_TEMPLATE_EMPTY',
  TOO_LONG: 'MESSAGE_TEMPLATE_TOO_LONG',
  UNBALANCED_SYNTAX: 'MESSAGE_TEMPLATE_UNBALANCED_SYNTAX',
} as const;

export class MessageTemplateError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static empty(): MessageTemplateError {
    return new MessageTemplateError({
      context: CONTEXT,
      type: MESSAGE_TEMPLATE_ERRORS.EMPTY,
      reason: 'The message template cannot be empty.',
      layer: 'domain',
    });
  }

  static tooLong(maxLength: number): MessageTemplateError {
    return new MessageTemplateError({
      context: CONTEXT,
      type: MESSAGE_TEMPLATE_ERRORS.TOO_LONG,
      reason: `The message template cannot exceed ${maxLength} characters.`,
      layer: 'domain',
      metadata: { maxLength },
    });
  }

  static unbalancedSyntax(): MessageTemplateError {
    return new MessageTemplateError({
      context: CONTEXT,
      type: MESSAGE_TEMPLATE_ERRORS.UNBALANCED_SYNTAX,
      reason: 'The message template has unbalanced or nested {{ }} placeholders.',
      layer: 'domain',
    });
  }
}
