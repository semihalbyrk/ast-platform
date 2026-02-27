import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
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
    return this.storageService.uploadBuffer(objectName, buffer, 'application/pdf');
  }

  private buildWeegbonPdf(inbound: Inbound): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const logoDist = path.join(__dirname, 'assets', 'AST-Logo.png');
      const logoSrc = path.join(process.cwd(), 'src', 'modules', 'pdf', 'assets', 'AST-Logo.png');
      const logoPath = fs.existsSync(logoDist) ? logoDist : logoSrc;
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, { width: 110 });
        doc.moveDown(0.5);
      }
      doc.fontSize(18).font('Helvetica-Bold').text('WEEGBON', { align: 'left' });
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(AST_COMPANY.name, { align: 'left' });
      doc.text(`${AST_COMPANY.street}, ${AST_COMPANY.city}`, { align: 'left' });
      doc.text(`Tel: ${AST_COMPANY.tel}`, { align: 'left' });
      doc.moveDown(1);
      this.drawLine(doc);
      doc.moveDown(0.5);

      const leftCol = 50;
      const rightCol = 300;
      let y = doc.y;

      const fields = [
        ['Weegbon Nr:', inbound.weegbonNr],
        ['Datum:', this.formatDate(inbound.inboundDate)],
        ['Kenteken:', inbound.licensePlate ?? '-'],
        ['Supplier (Leverancier):', inbound.supplier?.name ?? '-'],
        ['Materiaal:', inbound.material?.name ?? '-'],
        ['Contract:', inbound.contract?.number ?? '-'],
      ];
      for (const [label, value] of fields) {
        doc.font('Helvetica-Bold').text(label, leftCol, y);
        doc.font('Helvetica').text(value, rightCol, y);
        y += 18;
      }
      y += 12;

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
        const impFields = [
          ['Vuil %:', `${inbound.impPct}%`],
          ['Vuil gewicht:', this.formatWeight(inbound.impWeight)],
          ['Netto na vuil:', this.formatWeight(inbound.netWeightAfterImp)],
        ];
        for (const [label, value] of impFields) {
          doc.font('Helvetica-Bold').text(label, leftCol, y);
          doc.font('Helvetica').text(value, rightCol, y);
          y += 18;
        }
      }

      y += 10;
      doc.y = y;
      this.drawLine(doc);
      doc.moveDown(0.5);
      y = doc.y;

      doc.fontSize(8).font('Helvetica');
      if (inbound.grossWeightAt) {
        doc.text(`Bruto gewogen: ${this.formatDateTime(inbound.grossWeightAt)}`, leftCol, y);
        y += 14;
      }
      if (inbound.tareWeightAt) {
        doc.text(`Tarra gewogen: ${this.formatDateTime(inbound.tareWeightAt)}`, leftCol, y);
        y += 14;
      }
      doc.text(`Afgedrukt: ${this.formatDateTime(new Date())}`, leftCol, y);
      doc.end();
    });
  }

  // ─── PURCHASE INVOICE (INKOOPFACTUUR) ──────────────────

  async generateInvoicePdf(po: PurchaseOrder): Promise<string> {
    const buffer = await this.buildInvoicePdf(po);
    const objectName = `invoices/${po.poNumber}.pdf`;
    return this.storageService.uploadBuffer(objectName, buffer, 'application/pdf');
  }

  private buildInvoicePdf(po: PurchaseOrder): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = 841.89; // A4 landscape
      const margin = 30;

      // ─── HEADER ─────────────────────────────────────────
      // Right: AST logo + company info
      const logoDist = path.join(__dirname, 'assets', 'AST-Logo.png');
      const logoSrc = path.join(process.cwd(), 'src', 'modules', 'pdf', 'assets', 'AST-Logo.png');
      const logoPath = fs.existsSync(logoDist) ? logoDist : logoSrc;
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, pageW - margin - 140, margin, { width: 140 });
      }

      // Right: company details below logo
      const compY = margin + 65;
      doc.fontSize(7).font('Helvetica');
      doc.text(AST_COMPANY.name, pageW - margin - 180, compY, { width: 180, align: 'right' });
      doc.text(AST_COMPANY.street, pageW - margin - 180, compY + 10, { width: 180, align: 'right' });
      doc.text(AST_COMPANY.city, pageW - margin - 180, compY + 20, { width: 180, align: 'right' });
      doc.text(`Tel: ${AST_COMPANY.tel}`, pageW - margin - 180, compY + 30, { width: 180, align: 'right' });
      doc.text(`KvK: ${AST_COMPANY.kvk}`, pageW - margin - 180, compY + 40, { width: 180, align: 'right' });
      doc.text(`BTW: ${AST_COMPANY.vat}`, pageW - margin - 180, compY + 50, { width: 180, align: 'right' });
      doc.text(`IBAN: ${AST_COMPANY.iban}`, pageW - margin - 180, compY + 60, { width: 180, align: 'right' });

      // Left: Title
      doc.fontSize(14).font('Helvetica-Bold').text('Inkoopfactuur/Credit Nota', margin, margin);
      doc.fontSize(10).text('Purchase Invoice/Credit Note', margin, margin + 18);
      doc.moveDown(0.5);

      let y = margin + 45;
      doc.fontSize(9).font('Helvetica');
      doc.font('Helvetica-Bold').text('Invoice Nr:', margin, y);
      doc.font('Helvetica').text(po.poNumber, margin + 80, y);
      y += 14;
      doc.font('Helvetica-Bold').text('Date:', margin, y);
      doc.font('Helvetica').text(this.formatDate(po.issueDate), margin + 80, y);
      y += 14;
      doc.font('Helvetica-Bold').text('Client:', margin, y);
      doc.font('Helvetica').text(po.client?.name ?? '-', margin + 80, y);
      y += 14;
      if (po.client?.street) {
        doc.text(`${po.client.street}, ${po.client?.postalCode ?? ''} ${po.client?.city ?? ''}`.trim(), margin + 80, y);
        y += 14;
      }
      if (po.client?.vatNr) {
        doc.text(`BTW: ${po.client.vatNr}`, margin + 80, y);
        y += 14;
      }

      y = Math.max(y, compY + 75) + 10;

      // ─── TABLE ──────────────────────────────────────────
      // Group line items by inbound
      const inboundMap = new Map<string, {
        inbound: typeof po.lineItems[0]['inbound'];
        materialLine?: typeof po.lineItems[0];
        impurityLine?: typeof po.lineItems[0];
      }>();

      for (const li of po.lineItems ?? []) {
        const key = li.inboundId ?? li.id;
        if (!inboundMap.has(key)) {
          inboundMap.set(key, { inbound: li.inbound });
        }
        const entry = inboundMap.get(key)!;
        if (li.lineType === LineType.MATERIAL) {
          entry.materialLine = li;
        } else {
          entry.impurityLine = li;
        }
      }

      // Column definitions
      const cols = [
        { label: 'Receipt Nr', x: margin, w: 75 },
        { label: 'Plate', x: margin + 75, w: 55 },
        { label: 'Date', x: margin + 130, w: 60 },
        { label: 'Material', x: margin + 190, w: 80 },
        { label: 'Contract Nr', x: margin + 270, w: 65 },
        { label: 'Total Ton', x: margin + 335, w: 55 },
        { label: 'Imp %', x: margin + 390, w: 40 },
        { label: 'Imp Ton', x: margin + 430, w: 50 },
        { label: 'Net Ton', x: margin + 480, w: 55 },
        { label: 'Contract Price €', x: margin + 535, w: 70 },
        { label: 'Imp Price €', x: margin + 605, w: 60 },
        { label: 'Total Price', x: margin + 665, w: 75 },
      ];

      // Header row
      doc.fontSize(7).font('Helvetica-Bold');
      doc.rect(margin, y, pageW - 2 * margin, 16).fill('#e8e8e8').stroke('#cccccc');
      doc.fillColor('#000000');
      for (const col of cols) {
        doc.text(col.label, col.x + 2, y + 4, { width: col.w - 4 });
      }
      y += 16;

      // Data rows
      doc.font('Helvetica').fontSize(7);
      let totalPrice = 0;

      for (const [, entry] of inboundMap) {
        if (y > 520) {
          doc.addPage();
          y = margin;
        }

        const ib = entry.inbound;
        const ml = entry.materialLine;
        const il = entry.impurityLine;

        const netWeightKg = Number(ib?.netWeight ?? 0);
        const impPct = Number(ib?.impPct ?? 0);
        const impWeightKg = Number(ib?.impWeight ?? 0);
        const netAfterImpKg = Number(ib?.netWeightAfterImp ?? netWeightKg);
        const contractPrice = Number(ml?.unitPrice ?? 0);
        const impPrice = il ? Math.abs(Number(il.unitPrice)) : 0;
        const rowTotal = (netAfterImpKg / 1000) * contractPrice - (impWeightKg / 1000) * impPrice;
        totalPrice += rowTotal;

        const rowData = [
          ib?.weegbonNr ?? '-',
          ib?.licensePlate ?? '-',
          ib ? this.formatDate(ib.inboundDate) : '-',
          ib?.material?.name ?? '-',
          ib?.contract?.number ?? '-',
          this.formatNum(netWeightKg / 1000, 3),
          this.formatNum(impPct, 2) + '%',
          this.formatNum(impWeightKg / 1000, 3),
          this.formatNum(netAfterImpKg / 1000, 3),
          this.formatNum(contractPrice, 2),
          this.formatNum(impPrice, 2),
          this.formatNum(rowTotal, 2),
        ];

        // Alternate row background
        const rowIdx = Array.from(inboundMap.keys()).indexOf(ib?.id ?? '');
        if (rowIdx % 2 === 0) {
          doc.rect(margin, y, pageW - 2 * margin, 14).fill('#f9f9f9').stroke();
          doc.fillColor('#000000');
        }

        for (let i = 0; i < cols.length; i++) {
          doc.text(rowData[i], cols[i].x + 2, y + 3, { width: cols[i].w - 4 });
        }
        y += 14;
      }

      // Totals row
      y += 2;
      this.drawLine(doc, y);
      y += 6;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Total:', cols[10].x + 2, y);
      doc.text(`€ ${this.formatNum(totalPrice, 2)}`, cols[11].x + 2, y);
      y += 16;
      doc.text('BTW (0%):', cols[10].x + 2, y);
      doc.text('€ 0.00', cols[11].x + 2, y);
      y += 16;
      doc.fontSize(11);
      doc.text('Total incl. BTW:', cols[9].x + 2, y);
      doc.text(`€ ${this.formatNum(totalPrice, 2)}`, cols[11].x + 2, y);

      // Footer
      y += 30;
      doc.fontSize(7).font('Helvetica');
      doc.text('EU reverse charge: BTW verlegd naar afnemer.', margin, y);
      y += 10;
      doc.text(
        `Betaling binnen ${po.contract?.paymentTerms ?? 7} dagen na factuurdatum op ${AST_COMPANY.iban}.`,
        margin,
        y,
      );

      doc.end();
    });
  }

  // ─── GET PDF BUFFERS (for download) ────────────────────

  async renderWeegbonBuffer(inbound: Inbound): Promise<Buffer> {
    return this.buildWeegbonPdf(inbound);
  }

  async getWeegbonPdf(weegbonNr: string): Promise<Buffer> {
    return this.storageService.getBuffer(`tickets/${weegbonNr}.pdf`);
  }

  async getInvoicePdf(poNumber: string): Promise<Buffer> {
    return this.storageService.getBuffer(`invoices/${poNumber}.pdf`);
  }

  // ─── HELPERS ───────────────────────────────────────────

  private drawLine(doc: PDFKit.PDFDocument, y?: number) {
    const currentY = y ?? doc.y;
    doc.moveTo(30, currentY).lineTo(811, currentY).strokeColor('#cccccc').stroke();
  }

  private formatDate(d: Date | string | null): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private formatDateTime(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleString('nl-NL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
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
