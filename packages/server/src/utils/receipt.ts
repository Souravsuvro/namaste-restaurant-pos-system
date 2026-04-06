import { config } from '../config/env';
import { IReceiptData } from '../models/Payment';
import { formatCurrency, formatDate } from './helpers';

const LINE_WIDTH = 48; // characters for 80mm thermal printer

function centerText(text: string): string {
  const padding = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function separator(char: string = '-'): string {
  return char.repeat(LINE_WIDTH);
}

function leftRight(left: string, right: string): string {
  const spaces = Math.max(1, LINE_WIDTH - left.length - right.length);
  return left + ' '.repeat(spaces) + right;
}

export function generateReceiptText(data: IReceiptData): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(centerText(data.restaurantName));
  lines.push(centerText(data.restaurantAddress));
  lines.push(centerText(data.restaurantPhone));
  lines.push(centerText(`TVA: ${data.vatNumber}`));
  lines.push(separator('='));

  // Order info
  lines.push(leftRight(`Order #${data.orderNumber}`, data.orderType.replace('_', ' ').toUpperCase()));
  if (data.tableName) {
    lines.push(`Table: ${data.tableName}`);
  }
  lines.push(`Date: ${data.date}`);
  lines.push(`Server: ${data.staffName}`);
  lines.push(separator('-'));

  // Items
  for (const item of data.items) {
    const itemTotal = formatCurrency(item.total);
    const itemLine = `${item.quantity}x ${item.name}`;
    lines.push(leftRight(itemLine, itemTotal));
    if (item.unitPrice !== item.total / item.quantity || item.quantity > 1) {
      lines.push(`   @ ${formatCurrency(item.unitPrice)} each`);
    }
    if (item.modifications && item.modifications.length > 0) {
      for (const mod of item.modifications) {
        lines.push(`   + ${mod}`);
      }
    }
  }

  lines.push(separator('-'));

  // Totals
  lines.push(leftRight('Subtotal:', formatCurrency(data.subtotal)));
  lines.push(leftRight(`Tax (${(data.taxRate * 100).toFixed(0)}%):`, formatCurrency(data.taxAmount)));
  if (data.discountAmount > 0) {
    lines.push(leftRight('Discount:', `-${formatCurrency(data.discountAmount)}`));
  }
  lines.push(separator('='));
  lines.push(leftRight('TOTAL:', formatCurrency(data.total)));
  lines.push(separator('='));

  // Payment info
  for (const payment of data.payments) {
    lines.push(leftRight(
      `Paid (${payment.method.toUpperCase()}):`,
      formatCurrency(payment.amount)
    ));
    if (payment.change > 0) {
      lines.push(leftRight('Change:', formatCurrency(payment.change)));
    }
    if (payment.tip > 0) {
      lines.push(leftRight('Tip:', formatCurrency(payment.tip)));
    }
  }

  lines.push(separator('-'));

  // Footer
  lines.push('');
  lines.push(centerText('Merci de votre visite!'));
  lines.push(centerText('Thank you for dining with us!'));
  lines.push('');
  lines.push(centerText(config.restaurant.name));
  lines.push('');

  return lines.join('\n');
}
