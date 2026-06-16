import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, type LayeredError } from '@org/shared';
import { PrismaService } from '@org/shared/infrastructure';
import { Workflow } from '../domain/aggregate/workflow.aggregate.js';
import type { WorkflowPersistenceProps } from '../domain/aggregate/interface/workflow.props.js';
import type { IWorkflowRepository } from '../domain/ports/workflow.repository.port.js';
import type { TriggerCondition, TriggerConditionInput } from '../domain/value-objects/trigger-condition.vo.js';
import type { RecipientInput } from '../domain/value-objects/recipient.vo.js';
import { WorkflowNotFoundError } from '../domain/errors/workflow-not-found.error.js';

/** Cliente transaccional opcional (para participar de un UnitOfWork). */
type PrismaTransactionClient = Prisma.TransactionClient;

type WorkflowRow = Prisma.WorkflowGetPayload<{ include: { recipients: true } }>;

/** Adaptador Prisma del puerto IWorkflowRepository. El modelo Prisma NO es el agregado. */
@Injectable()
export class PrismaWorkflowRepository implements IWorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  //#region writes
  async save(workflow: Workflow, tx?: PrismaTransactionClient): Promise<void> {
    const db = tx ?? this.prisma;
    await db.workflow.create({ data: PrismaWorkflowRepository.toCreateInput(workflow) });
  }
  //#endregion

  //#region reads
  async getById(id: string): Promise<Result<Workflow, LayeredError>> {
    const row = await this.prisma.workflow.findUnique({
      where: { id },
      include: { recipients: true },
    });
    if (!row) {
      return Result.fail<Workflow>(WorkflowNotFoundError.withId(id));
    }
    return Workflow.fromPersistence(PrismaWorkflowRepository.toPersistenceProps(row));
  }

  async findById(id: string): Promise<Workflow | null> {
    const row = await this.prisma.workflow.findUnique({
      where: { id },
      include: { recipients: true },
    });
    if (!row) {
      return null;
    }
    const result = Workflow.fromPersistence(
      PrismaWorkflowRepository.toPersistenceProps(row),
    );
    if (result.isFailure()) {
      // Datos corruptos en base: no es "no encontrado", es una anomalía.
      throw result.error;
    }
    return result.value;
  }
  //#endregion

  //#region mapping (modelo Prisma <-> agregado)
  private static toCreateInput(workflow: Workflow): Prisma.WorkflowCreateInput {
    return {
      id: workflow.id,
      name: workflow.name,
      isActive: workflow.isActive,
      messageTemplate: workflow.messageTemplate.raw,
      ...PrismaWorkflowRepository.flattenCondition(workflow.triggerCondition),
      recipients: {
        create: workflow.recipients.map((recipient) => ({
          channel: recipient.channel,
          destination:
            recipient.channel === 'email' ? recipient.address : recipient.target,
        })),
      },
    };
  }

  private static flattenCondition(
    condition: TriggerCondition,
  ): Pick<
    Prisma.WorkflowCreateInput,
    | 'triggerType'
    | 'metricName'
    | 'operator'
    | 'thresholdValue'
    | 'baseValue'
    | 'deviationPercent'
    | 'direction'
  > {
    if (condition.type === 'threshold') {
      return {
        triggerType: 'threshold',
        metricName: condition.metricName,
        operator: condition.operator,
        thresholdValue: condition.value,
        baseValue: null,
        deviationPercent: null,
        direction: null,
      };
    }
    return {
      triggerType: 'variance',
      metricName: null,
      operator: null,
      thresholdValue: null,
      baseValue: condition.baseValue,
      deviationPercent: condition.deviationPercent,
      direction: condition.direction,
    };
  }

  private static toPersistenceProps(row: WorkflowRow): WorkflowPersistenceProps {
    return {
      id: row.id,
      name: row.name,
      isActive: row.isActive,
      messageTemplate: row.messageTemplate,
      triggerCondition: PrismaWorkflowRepository.unflattenCondition(row),
      recipients: row.recipients.map((recipient) =>
        PrismaWorkflowRepository.toRecipientInput(recipient.channel, recipient.destination),
      ),
    };
  }

  private static unflattenCondition(row: WorkflowRow): TriggerConditionInput {
    if (row.triggerType === 'threshold') {
      return {
        type: 'threshold',
        metricName: row.metricName ?? '',
        operator: row.operator ?? '',
        value: row.thresholdValue ?? Number.NaN,
      };
    }
    return {
      type: 'variance',
      baseValue: row.baseValue ?? Number.NaN,
      deviationPercent: row.deviationPercent ?? Number.NaN,
      direction: row.direction ?? '',
    };
  }

  private static toRecipientInput(
    channel: string,
    destination: string,
  ): RecipientInput {
    return channel === 'email'
      ? { channel: 'email', address: destination }
      : { channel: 'in-app', target: destination };
  }
  //#endregion
}
