import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Flame, Leaf, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useMenuItems,
  useCategories,
  useCreateMenuItem,
  useUpdateMenuItem,
  useToggleAvailability,
  useDeleteMenuItem,
} from '@/hooks/useMenu';
import type { MenuItem, CreateMenuItemPayload } from '@/types/menu';

const emptyForm: CreateMenuItemPayload = {
  category_id: '',
  name: '',
  description: '',
  price: 0,
  spice_level: 0,
  is_vegetarian: false,
  is_vegan: false,
};

export function MenuManagement() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<CreateMenuItemPayload>(emptyForm);

  const { data: items, isLoading } = useMenuItems({
    category_id: selectedCategory || undefined,
    search: searchQuery || undefined,
  });
  const { data: categories } = useCategories();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const toggleAvailability = useToggleAvailability();
  const deleteItem = useDeleteMenuItem();

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      spice_level: item.spice_level,
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, category_id: categories?.[0]?.id || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, payload: form });
    } else {
      await createItem.mutateAsync(form);
    }
    setShowForm(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItem.mutate(id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#1e3a5f] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cream">Menu Management</h1>
          <p className="text-sm text-cream/40 mt-0.5">
            {items?.length || 0} items across {categories?.length || 0} categories
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={handleNew}>
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-[#1e3a5f] flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#162a4a] border border-[#1e3a5f] rounded-lg pl-9 pr-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-saffron/50"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-saffron text-white'
                : 'bg-[#162a4a] text-cream/60 border border-[#1e3a5f]'
            }`}
          >
            All
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-saffron text-white'
                  : 'bg-[#162a4a] text-cream/60 border border-[#1e3a5f]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-[#162a4a] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#1e3a5f]">
            {items?.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-[#162a4a]/50 transition-colors ${
                  !item.available ? 'opacity-50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-cream">{item.name}</h3>
                    {item.is_vegetarian && (
                      <Leaf size={14} className="text-emerald-400" />
                    )}
                    {item.is_vegan && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1 rounded">
                        V+
                      </span>
                    )}
                    {item.spice_level > 0 && (
                      <div className="flex">
                        {Array.from({ length: item.spice_level }).map((_, i) => (
                          <Flame key={i} size={10} className="text-tandoori fill-tandoori" />
                        ))}
                      </div>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-cream/40 truncate">{item.description}</p>
                  )}
                  <p className="text-xs text-cream/30 mt-0.5">
                    {item.category_name || 'Uncategorized'}
                  </p>
                </div>
                <span className="text-base font-bold text-saffron min-w-[60px] text-right">
                  {'\u20AC'}{item.price.toFixed(2)}
                </span>
                <Badge variant={item.available ? 'success' : 'danger'}>
                  {item.available ? 'Available' : 'Unavailable'}
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleAvailability.mutate(item.id)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Toggle availability"
                  >
                    {item.available ? (
                      <ToggleRight size={20} className="text-emerald-400" />
                    ) : (
                      <ToggleLeft size={20} className="text-cream/30" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-cream/60 hover:text-cream"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg hover:bg-tandoori/10 transition-colors text-cream/30 hover:text-tandoori"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Menu Item' : 'New Menu Item'}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              className="border border-[#1e3a5f]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={createItem.isPending || updateItem.isPending}
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-cream/60 mb-1.5">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
              placeholder="Item name"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/60 mb-1.5">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
            >
              <option value="">Select category</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-cream/60 mb-1.5">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50 resize-none"
              rows={2}
              placeholder="Description (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cream/60 mb-1.5">Price ({'\u20AC'})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
              />
            </div>
            <div>
              <label className="block text-xs text-cream/60 mb-1.5">Spice Level</label>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setForm({ ...form, spice_level: level })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all ${
                      (form.spice_level || 0) >= level && level > 0
                        ? 'bg-tandoori/20 text-tandoori border border-tandoori/40'
                        : level === 0 && form.spice_level === 0
                          ? 'bg-[#1e3a5f] text-cream border border-cream/20'
                          : 'bg-[#0f1f3d] text-cream/30 border border-[#1e3a5f]'
                    }`}
                  >
                    {level === 0 ? '0' : <Flame size={12} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_vegetarian || false}
                onChange={(e) => setForm({ ...form, is_vegetarian: e.target.checked })}
                className="w-4 h-4 rounded border-[#1e3a5f] bg-[#0f1f3d] text-emerald-500 focus:ring-0"
              />
              <span className="text-sm text-cream/70">Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_vegan || false}
                onChange={(e) => setForm({ ...form, is_vegan: e.target.checked })}
                className="w-4 h-4 rounded border-[#1e3a5f] bg-[#0f1f3d] text-emerald-500 focus:ring-0"
              />
              <span className="text-sm text-cream/70">Vegan</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
