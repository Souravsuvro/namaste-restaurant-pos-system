export type TableStatus = 'available' | 'occupied' | 'reserved' | 'needs_cleaning';

export interface ITable {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  current_order_id: string | null;
  position_x: number;
  position_y: number;
}

export interface ITableWithOrder extends ITable {
  order_status?: string;
  order_total?: number;
  order_created_at?: string;
}
