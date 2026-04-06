export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  modifications: string | null;
  notes: string | null;
  status: OrderItemStatus;
  created_at: string;
  menu_item_name?: string;
}

export interface Order {
  id: string;
  order_number: number;
  table_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  customer_name: string | null;
  staff_id: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  table_number?: number;
  staff_name?: string;
}

export interface CreateOrderPayload {
  table_id?: string;
  order_type: OrderType;
  notes?: string;
  customer_name?: string;
  items: {
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    modifications?: string;
    notes?: string;
  }[];
  discount_amount?: number;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  notes?: string;
  customer_name?: string;
  discount_amount?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  order_type?: OrderType;
  table_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface Payment {
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

export interface CreatePaymentPayload {
  order_id: string;
  amount: number;
  method: PaymentMethod;
  tip_amount?: number;
  reference?: string;
}
