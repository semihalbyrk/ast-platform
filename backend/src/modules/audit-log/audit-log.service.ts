import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: string;
    oldValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    userId?: string | null;
  }): Promise<void> {
    const entry = this.auditLogRepository.create({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      oldValue: (params.oldValue ?? null) as Record<string, unknown> | null,
      newValue: (params.newValue ?? null) as Record<string, unknown> | null,
      userId: params.userId ?? null,
    });
    await this.auditLogRepository.save(entry);
  }
}
