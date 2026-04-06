export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface IOrder {
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
}

export interface IOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  modifications: string | null;
  notes: string | null;
  status: OrderItemStatus;
  created_at: string;
}

export interface IOrderItemWithDetails extends IOrderItem {
  menu_item_name: string;
  menu_item_price: number;
}

export interface IOrderWithItems extends IOrder {
  items: IOrderItemWithDetails[];
  table_number?: number;
  staff_name?: string;
}
