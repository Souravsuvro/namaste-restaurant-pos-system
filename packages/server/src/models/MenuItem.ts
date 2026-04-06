export interface ICategory {
  id: string;
  name: string;
  display_order: number;
  active: number;
}

export interface IMenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: number;
  spice_level: number;
  is_vegetarian: number;
  is_vegan: number;
  created_at: string;
  updated_at: string;
}

export interface IMenuItemWithCategory extends IMenuItem {
  category_name: string;
  category_display_order: number;
}
