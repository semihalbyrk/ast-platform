import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { StorageService } from './storage.service';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { LineType } from '../../common/enums';

const AST_COMPANY = {
  name: 'Amsterdam Scrap Terminal B.V.',
  street: 'Vlothavenweg 1',
  city: '1013 BJ Amsterdam',
  tel: '+31(0)20 705 2333',
  vat: 'NL856875983B01',
  kvk: '67207405',
  iban: 'NL76UGBI0709898894',
};

@Injectable()
export class PdfService {
  constructor(private readonly storageService: StorageService) {}

  // ─── WEIGHBRIDGE TICKET (WEEGBON) ───────────────────────

  async generateWeegbonPdf(inbound: Inbound): Promise<string> {
    const buffer = await this.buildWeegbonPdf(inbound);
    const objectName = `tickets/${inbound.weegbonNr}.pdf`;
    return this.storageService.uploadBuffer(
      objectName,
      buffer,
      'application/pdf',
    );
  }

  private buildWeegbonPdf(inbound: Inbound): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('WEEGBON', { align: 'center' });
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(AST_COMPANY.name, { align: 'center' });
      doc.text(`${AST_COMPANY.street}, ${AST_COMPANY.city}`, {
        align: 'center',
      });
      doc.text(`Tel: ${AST_COMPANY.tel}`, { align: 'center' });
      doc.moveDown(1);

      // Divider
      this.drawLine(doc);
      doc.moveDown(0.5);

      // Ticket info
      const leftCol = 50;
      const rightCol = 300;
      let y = doc.y;

      doc.font('Helvetica-Bold').text('Weegbon Nr:', leftCol, y);
      doc.font('Helvetica').text(inbound.weegbonNr, rightCol, y);
      y += 18;

      doc.font('Helvetica-Bold').text('Datum:', leftCol, y);
      doc
        .font('Helvetica')
        .text(this.formatDate(inbound.inboundDate), rightCol, y);
      y += 18;

      doc.font('Helvetica-Bold').text('Kenteken:', leftCol, y);
      doc.font('Helvetica').text(inbound.licensePlate ?? '-', rightCol, y);
      y += 18;

      doc.font('Helvetica-Bold').text('Leverancier:', leftCol, y);
      doc.font('Helvetica').text(inbound.supplier?.name ?? '-', rightCol, y);
      y += 18;

      doc.font('Helvetica-Bold').text('Materiaal:', leftCol, y);
      doc.font('Helvetica').text(inbound.material?.name ?? '-', rightCol, y);
      y += 18;

      doc.font('Helvetica-Bold').text('Contract:', leftCol, y);
      doc
        .font('Helvetica')
        .text(inbound.contract?.number ?? '-', rightCol, y);
      y += 30;

      // Weights section
      doc.y = y;
      this.drawLine(doc);
      doc.moveDown(0.5);
      y = doc.y;

      doc.fontSize(12).font('Helvetica-Bold').text('GEWICHTEN', leftCol, y);
      y += 25;

      const weightRows = [
        ['Bruto gewicht:', this.formatWeight(inbound.grossWeight)],
        ['Tarra gewicht:', this.formatWeight(inbound.tareWeight)],
        ['Netto gewicht:', this.formatWeight(inbound.netWeight)],
      ];

      for (const [label, value] of weightRows) {
        doc.fontSize(10).font('Helvetica-Bold').text(label, leftCol, y);
        doc.font('Helvetica').text(value, rightCol, y);
        y += 18;
      }

      if (inbound.impPct != null) {
        y += 5;
        doc.font('Helvetica-Bold').text('Vuil %:', leftCol, y);
        doc.font('Helvetica').text(`${inbound.impPct}%`, rightCol, y);
        y += 18;

        doc.font('Helvetica-Bold').text('Vuil gewicht:', leftCol, y);
        doc.font('Helvetica').text(this.formatWeight(inbound.impWeight), rightCol, y);
        y += 18;

        doc.font('Helvetica-Bold').text('Netto na vuil:', leftCol, y);
        doc
          .font('Helvetica')
          .text(this.formatWeight(inbound.netWeightAfterImp), rightCol, y);
        y += 18;
      }

      y += 10;
      doc.y = y;
      this.drawLine(doc);
      doc.moveDown(0.5);
      y = doc.y;

      // Timestamps
      doc.fontSize(8).font('Helvetica');
      if (inbound.grossWeightAt) {
        doc.text(
          `Bruto gewogen: ${this.formatDateTime(inbound.grossWeightAt)}`,
          leftCol,
          y,
        );
        y += 14;
      }
      if (inbound.tareWeightAt) {
        doc.text(
          `Tarra gewogen: ${this.formatDateTime(inbound.tareWeightAt)}`,
          leftCol,
          y,
        );
        y += 14;
      }

      doc.text(
        `Afgedrukt: ${this.formatDateTime(new Date())}`,
        leftCol,
        y,
      );

      doc.end();
    });
  }

  // ─── PURCHASE INVOICE (INKOOPFACTUUR) ──────────────────

  async generateInvoicePdf(po: PurchaseOrder): Promise<string> {
    const buffer = await this.buildInvoicePdf(po);
    const objectName = `invoices/${po.poNumber}.pdf`;
    return this.storageService.uploadBuffer(
      objectName,
      buffer,
      'application/pdf',
    );
  }

  private buildInvoicePdf(po: PurchaseOrder): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('INKOOPFACTUUR', { align: 'center' });
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(AST_COMPANY.name, { align: 'center' });
      doc.text(`${AST_COMPANY.street}, ${AST_COMPANY.city}`, {
        align: 'center',
      });
      doc.text(
        `BTW: ${AST_COMPANY.vat} | KvK: ${AST_COMPANY.kvk} | IBAN: ${AST_COMPANY.iban}`,
        { align: 'center' },
      );
      doc.moveDown(1);
      this.drawLine(doc);
      doc.moveDown(0.5);

      // Two-column: PO info left, supplier right
      const leftCol = 50;
      const rightCol = 320;
      let y = doc.y;

      // Left: PO details
      doc.font('Helvetica-Bold').text('Factuur Nr:', leftCol, y);
      doc.font('Helvetica').text(po.poNumber, leftCol + 100, y);
      y += 16;
      doc.font('Helvetica-Bold').text('Datum:', leftCol, y);
      doc
        .font('Helvetica')
        .text(this.formatDate(po.issueDate), leftCol + 100, y);
      y += 16;
      doc.font('Helvetica-Bold').text('Periode:', leftCol, y);
      doc
        .font('Helvetica')
        .text(
          `${this.formatDate(po.periodStart)} — ${this.formatDate(po.periodEnd)}`,
          leftCol + 100,
          y,
        );
      y += 16;
      if (po.paymentDueDate) {
        doc.font('Helvetica-Bold').text('Betaaldatum:', leftCol, y);
        doc
          .font('Helvetica')
          .text(this.formatDate(po.paymentDueDate), leftCol + 100, y);
        y += 16;
      }

      // Right: Supplier
      const supplierY = doc.y - 64;
      doc
        .font('Helvetica-Bold')
        .text('Leverancier:', rightCol, supplierY);
      let sy = supplierY + 16;
      doc.font('Helvetica').text(po.supplier?.name ?? '-', rightCol, sy);
      sy += 14;
      if (po.supplier?.street) {
        doc.text(po.supplier.street, rightCol, sy);
        sy += 14;
      }
      if (po.supplier?.postalCode || po.supplier?.city) {
        doc.text(
          `${po.supplier?.postalCode ?? ''} ${po.supplier?.city ?? ''}`.trim(),
          rightCol,
          sy,
        );
        sy += 14;
      }
      if (po.supplier?.vatNr) {
        doc.text(`BTW: ${po.supplier.vatNr}`, rightCol, sy);
      }

      // Line items table
      doc.y = Math.max(y, sy) + 20;
      this.drawLine(doc);
      doc.moveDown(0.5);
      y = doc.y;

      // Table header
      const cols = {
        desc: 50,
        qty: 300,
        price: 380,
        total: 470,
      };

      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Omschrijving', cols.desc, y);
      doc.text('Kg', cols.qty, y);
      doc.text('€/ton', cols.price, y);
      doc.text('Totaal €', cols.total, y);
      y += 16;
      this.drawLine(doc, y);
      y += 5;

      // Line items
      doc.font('Helvetica').fontSize(9);
      const lineItems = po.lineItems ?? [];
      for (const li of lineItems) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const isImpurity = li.lineType === LineType.IMPURITY;
        doc.font(isImpurity ? 'Helvetica-Oblique' : 'Helvetica');

        doc.text(li.description ?? '-', cols.desc, y, { width: 240 });
        doc.text(this.formatNum(li.quantityKg, 0), cols.qty, y);
        doc.text(this.formatNum(li.unitPrice, 2), cols.price, y);
        doc.text(this.formatNum(li.lineTotal, 2), cols.total, y);
        y += 16;
      }

      // Totals
      y += 5;
      this.drawLine(doc, y);
      y += 10;
      doc.font('Helvetica-Bold').fontSize(10);

      doc.text('Subtotaal excl. BTW:', cols.price - 80, y);
      doc.text(`€ ${this.formatNum(po.totalExclVat, 2)}`, cols.total, y);
      y += 18;

      doc.text(`BTW (${po.vatCode}%):`, cols.price - 80, y);
      doc.text(`€ ${this.formatNum(po.vat, 2)}`, cols.total, y);
      y += 18;

      doc.fontSize(12);
      doc.text('Totaal incl. BTW:', cols.price - 80, y);
      doc.text(`€ ${this.formatNum(po.totalInclVat, 2)}`, cols.total, y);

      // Footer
      y += 40;
      doc.fontSize(8).font('Helvetica');
      doc.text(
        'EU reverse charge: BTW verlegd naar afnemer.',
        leftCol,
        y,
      );
      y += 12;
      doc.text(
        `Betaling binnen ${po.contract?.paymentTerms ?? 7} dagen na factuurdatum op ${AST_COMPANY.iban}.`,
        leftCol,
        y,
      );

      doc.end();
    });
  }

  // ─── GET PDF BUFFERS (for download) ────────────────────

  async getWeegbonPdf(weegbonNr: string): Promise<Buffer> {
    return this.storageService.getBuffer(`tickets/${weegbonNr}.pdf`);
  }

  async getInvoicePdf(poNumber: string): Promise<Buffer> {
    return this.storageService.getBuffer(`invoices/${poNumber}.pdf`);
  }

  // ─── HELPERS ───────────────────────────────────────────

  private drawLine(doc: PDFKit.PDFDocument, y?: number) {
    const currentY = y ?? doc.y;
    doc
      .moveTo(50, currentY)
      .lineTo(545, currentY)
      .strokeColor('#cccccc')
      .stroke();
  }

  private formatDate(d: Date | string | null): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatDateTime(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatWeight(kg: number | null | undefined): string {
    if (kg == null) return '-';
    return `${kg.toLocaleString('nl-NL')} kg`;
  }

  private formatNum(value: number | null | undefined, decimals: number): string {
    if (value == null) return '-';
    return Number(value).toFixed(decimals);
  }
}
