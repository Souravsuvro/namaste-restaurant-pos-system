export type TableStatus = 'available' | 'occupied' | 'reserved' | 'needs_cleaning';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  current_order_id: string | null;
  position_x: number;
  position_y: number;
  current_order_total?: number;
}
