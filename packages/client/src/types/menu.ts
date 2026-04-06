export interface Category {
  id: string;
  name: string;
  display_order: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  spice_level: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface MenuFilters {
  category_id?: string;
  available?: boolean;
  search?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
}

export interface CreateMenuItemPayload {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  spice_level?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
}

export interface UpdateMenuItemPayload extends Partial<CreateMenuItemPayload> {
  available?: boolean;
}
