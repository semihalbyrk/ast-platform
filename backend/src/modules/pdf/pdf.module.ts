import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { StorageService } from './storage.service';

@Module({
  providers: [PdfService, StorageService],
  exports: [PdfService],
})
export class PdfModule {}
