'use client';

import { useState } from 'react';
import { createWorkflowSchema, type CreateWorkflowInput } from '@org/contracts';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorMessage,
  Field,
  SelectField,
  TextareaField,
} from '@/components/ui';

type TriggerType = 'threshold' | 'variance';
type Channel = 'email' | 'in-app';

interface RecipientField {
  channel: Channel;
  /** Destino: address (email) o target (in-app), según el canal. */
  value: string;
}

export interface WorkflowFormValues {
  name: string;
  type: TriggerType;
  // threshold
  metricName: string;
  operator: string;
  value: string;
  // variance
  baseValue: string;
  deviationPercent: string;
  direction: string;
  messageTemplate: string;
  recipients: RecipientField[];
}

export const EMPTY_WORKFLOW_FORM: WorkflowFormValues = {
  name: '',
  type: 'threshold',
  metricName: '',
  operator: '>',
  value: '',
  baseValue: '',
  deviationPercent: '',
  direction: 'above',
  messageTemplate: '',
  recipients: [{ channel: 'in-app', value: '' }],
};

const OPERATORS = ['>', '<', '>=', '<=', '==', '!='] as const;
const DIRECTIONS = [
  { value: 'above', label: 'Por encima' },
  { value: 'below', label: 'Por debajo' },
  { value: 'any', label: 'Cualquiera' },
];
const CHANNELS = [
  { value: 'in-app', label: 'In-app' },
  { value: 'email', label: 'Email' },
];
const MESSAGE_VARS: Record<TriggerType, string[]> = {
  threshold: ['{{metrica}}', '{{valor}}', '{{umbral}}', '{{operador}}'],
  variance: ['{{valor}}', '{{base}}', '{{desvio}}', '{{direccion}}'],
};

function toNumber(raw: string): number {
  return raw.trim() === '' ? Number.NaN : Number(raw);
}

interface WorkflowFormProps {
  mode: 'create' | 'edit';
  initialValues?: WorkflowFormValues;
  submitting: boolean;
  submitError?: string | null;
  onSubmit: (input: CreateWorkflowInput) => void;
  onCancel: () => void;
}

export function WorkflowForm({
  mode,
  initialValues,
  submitting,
  submitError,
  onSubmit,
  onCancel,
}: WorkflowFormProps) {
  const [values, setValues] = useState<WorkflowFormValues>(
    initialValues ?? EMPTY_WORKFLOW_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof WorkflowFormValues>(
    key: K,
    val: WorkflowFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: val }));

  const setRecipient = (index: number, patch: Partial<RecipientField>) =>
    setValues((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r, i) =>
        i === index ? { ...r, ...patch } : r,
      ),
    }));

  const addRecipient = () =>
    setValues((prev) => ({
      ...prev,
      recipients: [...prev.recipients, { channel: 'in-app', value: '' }],
    }));

  const removeRecipient = (index: number) =>
    setValues((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const result = createWorkflowSchema.safeParse({
      name: values.name.trim(),
      triggerCondition:
        values.type === 'threshold'
          ? {
              type: 'threshold',
              metricName: values.metricName.trim(),
              operator: values.operator,
              value: toNumber(values.value),
            }
          : {
              type: 'variance',
              baseValue: toNumber(values.baseValue),
              deviationPercent: toNumber(values.deviationPercent),
              direction: values.direction,
            },
      messageTemplate: values.messageTemplate,
      recipients: values.recipients.map((r) =>
        r.channel === 'email'
          ? { channel: 'email', address: r.value.trim() }
          : { channel: 'in-app', target: r.value.trim() },
      ),
    });

    if (!result.success) {
      const map: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (!map[key]) {
          map[key] = issue.message;
        }
      }
      setErrors(map);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <ErrorMessage title="No se pudo guardar" message={submitError} />
      )}

      <Card>
        <CardHeader title="Datos generales" />
        <CardBody className="space-y-4">
          <Field
            id="name"
            label="Nombre"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors['name']}
            maxLength={100}
            placeholder="Alerta CPU alta"
          />

          <SelectField
            id="type"
            label="Tipo de disparo"
            value={values.type}
            onChange={(e) => set('type', e.target.value as TriggerType)}
          >
            <option value="threshold">Umbral</option>
            <option value="variance">Varianza</option>
          </SelectField>

          {values.type === 'threshold' ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="metricName"
                label="Métrica"
                value={values.metricName}
                onChange={(e) => set('metricName', e.target.value)}
                error={errors['triggerCondition.metricName']}
                maxLength={100}
                placeholder="cpu"
              />
              <SelectField
                id="operator"
                label="Operador"
                value={values.operator}
                onChange={(e) => set('operator', e.target.value)}
                error={errors['triggerCondition.operator']}
              >
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </SelectField>
              <Field
                id="value"
                label="Valor"
                type="number"
                step="any"
                value={values.value}
                onChange={(e) => set('value', e.target.value)}
                error={errors['triggerCondition.value']}
                placeholder="90"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="baseValue"
                label="Valor base"
                type="number"
                step="any"
                value={values.baseValue}
                onChange={(e) => set('baseValue', e.target.value)}
                error={errors['triggerCondition.baseValue']}
                placeholder="1000"
              />
              <Field
                id="deviationPercent"
                label="Desviación (%)"
                type="number"
                step="any"
                value={values.deviationPercent}
                onChange={(e) => set('deviationPercent', e.target.value)}
                error={errors['triggerCondition.deviationPercent']}
                placeholder="20"
              />
              <SelectField
                id="direction"
                label="Dirección"
                value={values.direction}
                onChange={(e) => set('direction', e.target.value)}
                error={errors['triggerCondition.direction']}
              >
                {DIRECTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </SelectField>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mensaje" />
        <CardBody className="space-y-2">
          <TextareaField
            id="messageTemplate"
            label="Mensaje de salida"
            value={values.messageTemplate}
            onChange={(e) => set('messageTemplate', e.target.value)}
            error={errors['messageTemplate']}
            maxLength={100}
            placeholder="La métrica {{metrica}} llegó a {{valor}}"
          />
          <p className="text-xs text-slate-500">
            Variables disponibles:{' '}
            {MESSAGE_VARS[values.type].map((v) => (
              <code
                key={v}
                className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-slate-600"
              >
                {v}
              </code>
            ))}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Destinatarios"
          actions={
            <Button type="button" variant="secondary" onClick={addRecipient}>
              Agregar
            </Button>
          }
        />
        <CardBody className="space-y-4">
          {errors['recipients'] && (
            <p className="text-xs text-red-600">{errors['recipients']}</p>
          )}
          {values.recipients.map((recipient, index) => {
            const destinoError =
              recipient.channel === 'email'
                ? errors[`recipients.${index}.address`]
                : errors[`recipients.${index}.target`];
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="w-40">
                  <SelectField
                    label={index === 0 ? 'Canal' : undefined}
                    value={recipient.channel}
                    onChange={(e) =>
                      setRecipient(index, {
                        channel: e.target.value as Channel,
                      })
                    }
                  >
                    {CHANNELS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div className="flex-1">
                  <Field
                    label={index === 0 ? 'Destino' : undefined}
                    type={recipient.channel === 'email' ? 'email' : 'text'}
                    value={recipient.value}
                    onChange={(e) =>
                      setRecipient(index, { value: e.target.value })
                    }
                    error={destinoError}
                    placeholder={
                      recipient.channel === 'email'
                        ? 'alguien@empresa.com'
                        : 'guardia'
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRecipient(index)}
                  disabled={values.recipients.length === 1}
                  className={
                    index === 0
                      ? 'mt-7 text-sm text-slate-400 hover:text-red-600 disabled:opacity-40'
                      : 'mt-2 text-sm text-slate-400 hover:text-red-600 disabled:opacity-40'
                  }
                  aria-label="Quitar destinatario"
                >
                  Quitar
                </button>
              </div>
            );
          })}
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === 'create' ? 'Crear workflow' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
