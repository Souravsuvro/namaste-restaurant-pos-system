export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed';

export interface IPayment {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  change_amount: number;
  tip_amount: number;
  created_at: string;
}

export interface IPaymentWithOrderInfo extends IPayment {
  order_number: number;
  order_total: number;
}

export interface IReceiptData {
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  vatNumber: string;
  orderNumber: number;
  orderType: string;
  tableName: string | null;
  date: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    modifications?: string[];
  }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  payments: {
    method: string;
    amount: number;
    change: number;
    tip: number;
  }[];
  staffName: string;
}
