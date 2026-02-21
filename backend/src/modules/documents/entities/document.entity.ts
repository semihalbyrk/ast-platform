import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DocumentType } from '../../../common/enums';

@Entity('documents')
export class Document extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'parent_type' })
  parentType: string;

  @Column({ type: 'uuid', name: 'parent_id' })
  parentId: string;

  @Column({ type: 'enum', enum: DocumentType, name: 'document_type' })
  documentType: DocumentType;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 500, name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'mime_type' })
  mimeType: string | null;

  @Column({ type: 'integer', nullable: true, name: 'file_size' })
  fileSize: number | null;
}
