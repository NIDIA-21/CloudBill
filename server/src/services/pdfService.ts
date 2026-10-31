import PDFDocument from 'pdfkit';
import { toNumber } from '../utils/helpers';

export function generateInvoicePDF(invoice: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Brightloop Software', 50, 50);
      doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Subscription Management Platform', 50, 80);
      
      // Invoice title
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e293b').text('INVOICE', 400, 50, { align: 'right' });
      doc.fontSize(11).font('Helvetica').fillColor('#64748b').text(`#${invoice.number}`, 400, 75, { align: 'right' });
      
      // Line
      doc.moveTo(50, 110).lineTo(545, 110).stroke('#e2e8f0');

      // Invoice details
      let y = 125;
      doc.fontSize(10).fillColor('#1e293b');
      
      // Left column - Bill To
      doc.font('Helvetica-Bold').text('Bill To:', 50, y);
      y += 16;
      doc.font('Helvetica').text(`${invoice.customer.firstName} ${invoice.customer.lastName}`, 50, y);
      y += 14;
      doc.fillColor('#64748b').text(invoice.customer.email, 50, y);
      
      // Right column - Invoice Info
      let ry = 125;
      doc.fillColor('#1e293b').font('Helvetica-Bold').text('Invoice Date:', 350, ry);
      doc.font('Helvetica').text(new Date(invoice.issueDate).toLocaleDateString('en-IN'), 440, ry);
      ry += 16;
      doc.font('Helvetica-Bold').text('Due Date:', 350, ry);
      doc.font('Helvetica').text(new Date(invoice.dueDate).toLocaleDateString('en-IN'), 440, ry);
      ry += 16;
      doc.font('Helvetica-Bold').text('Status:', 350, ry);
      doc.font('Helvetica').text(invoice.status.toUpperCase(), 440, ry);
      ry += 16;
      if (invoice.subscription) {
        doc.font('Helvetica-Bold').text('Subscription:', 350, ry);
        doc.font('Helvetica').text(invoice.subscription.number, 440, ry);
      }
      
      // Billing Period
      y += 30;
      doc.fillColor('#1e293b').font('Helvetica-Bold').text('Billing Period:', 50, y);
      doc.font('Helvetica').text(
        `${new Date(invoice.periodStart).toLocaleDateString('en-IN')} - ${new Date(invoice.periodEnd).toLocaleDateString('en-IN')}`,
        150, y
      );

      // Table Header
      y += 30;
      doc.rect(50, y, 495, 22).fill('#f1f5f9');
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9);
      doc.text('Product', 55, y + 6, { width: 150 });
      doc.text('Variant', 205, y + 6, { width: 80 });
      doc.text('Qty', 290, y + 6, { width: 35, align: 'center' });
      doc.text('Unit Price', 330, y + 6, { width: 65, align: 'right' });
      doc.text('Tax', 400, y + 6, { width: 55, align: 'right' });
      doc.text('Total', 460, y + 6, { width: 80, align: 'right' });

      // Table rows
      y += 24;
      doc.font('Helvetica').fontSize(9);
      
      for (const item of invoice.items) {
        doc.fillColor('#334155');
        doc.text(item.productName, 55, y, { width: 150 });
        doc.text(item.variantName || '-', 205, y, { width: 80 });
        doc.text(String(item.quantity), 290, y, { width: 35, align: 'center' });
        doc.text(`Rs.${toNumber(item.unitPrice).toFixed(2)}`, 330, y, { width: 65, align: 'right' });
        doc.text(`Rs.${toNumber(item.taxAmount).toFixed(2)}`, 400, y, { width: 55, align: 'right' });
        doc.text(`Rs.${toNumber(item.lineTotal).toFixed(2)}`, 460, y, { width: 80, align: 'right' });
        y += 18;
        
        // Draw separator line
        doc.moveTo(50, y - 2).lineTo(545, y - 2).stroke('#f1f5f9');
      }

      // Totals
      y += 15;
      doc.moveTo(350, y).lineTo(545, y).stroke('#e2e8f0');
      y += 10;
      
      doc.font('Helvetica').fontSize(10).fillColor('#64748b');
      doc.text('Subtotal:', 350, y);
      doc.text(`Rs.${toNumber(invoice.subtotal).toFixed(2)}`, 460, y, { width: 80, align: 'right' });
      y += 18;

      if (toNumber(invoice.discountAmount) > 0) {
        doc.fillColor('#16a34a');
        doc.text('Discount:', 350, y);
        doc.text(`-Rs.${toNumber(invoice.discountAmount).toFixed(2)}`, 460, y, { width: 80, align: 'right' });
        y += 18;
      }

      doc.fillColor('#64748b');
      doc.text('Tax:', 350, y);
      doc.text(`Rs.${toNumber(invoice.taxAmount).toFixed(2)}`, 460, y, { width: 80, align: 'right' });
      y += 18;

      doc.moveTo(350, y).lineTo(545, y).stroke('#1e293b');
      y += 8;
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e293b');
      doc.text('Total:', 350, y);
      doc.text(`Rs.${toNumber(invoice.total).toFixed(2)}`, 440, y, { width: 100, align: 'right' });
      y += 22;

      if (toNumber(invoice.paidAmount) > 0) {
        doc.font('Helvetica').fontSize(10).fillColor('#16a34a');
        doc.text('Paid:', 350, y);
        doc.text(`Rs.${toNumber(invoice.paidAmount).toFixed(2)}`, 460, y, { width: 80, align: 'right' });
        y += 18;
      }

      if (toNumber(invoice.outstandingAmount) > 0) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#dc2626');
        doc.text('Outstanding:', 350, y);
        doc.text(`Rs.${toNumber(invoice.outstandingAmount).toFixed(2)}`, 440, y, { width: 100, align: 'right' });
      }

      // Footer
      const footerY = 750;
      doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#e2e8f0');
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
      doc.text('Thank you for your business!', 50, footerY + 10, { align: 'center', width: 495 });
      doc.text(`Brightloop Software | Generated on ${new Date().toLocaleDateString('en-IN')}`, 50, footerY + 22, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
