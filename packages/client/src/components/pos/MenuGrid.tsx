import { Flame, Leaf } from 'lucide-react';
import { useMenuItems } from '@/hooks/useMenu';
import { useCartStore } from '@/store/cart-store';
import type { MenuItem } from '@/types/menu';

interface MenuGridProps {
  categoryId: string | null;
  searchQuery: string;
}

function SpiceDots({ level }: { level: number }) {
  if (level === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Flame
          key={i}
          size={10}
          className={i < level ? 'text-tandoori fill-tandoori' : 'text-cream/20'}
        />
      ))}
    </div>
  );
}

function MenuItemCard({ item }: { item: MenuItem }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <button
      onClick={() => {
        if (item.available) addItem(item);
      }}
      disabled={!item.available}
      className={`
        relative text-left p-4 rounded-xl border transition-all duration-200
        ${
          item.available
            ? 'bg-[#162a4a] border-[#1e3a5f] hover:border-saffron/50 hover:shadow-lg hover:shadow-saffron/10 active:scale-[0.98]'
            : 'bg-[#0d1a30] border-[#152240] opacity-50 cursor-not-allowed'
        }
      `}
    >
      {!item.available && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 z-10">
          <span className="text-xs font-medium text-tandoori bg-tandoori/20 px-3 py-1 rounded-full border border-tandoori/30">
            Unavailable
          </span>
        </div>
      )}
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-cream leading-tight pr-2">
            {item.name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {item.is_vegetarian && (
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Leaf size={12} className="text-emerald-400" />
              </span>
            )}
            {item.is_vegan && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                V+
              </span>
            )}
          </div>
        </div>
        {item.description && (
          <p className="text-xs text-cream/40 mb-2 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-bold text-saffron">
            {'\u20AC'}{item.price.toFixed(2)}
          </span>
          <SpiceDots level={item.spice_level} />
        </div>
      </div>
    </button>
  );
}

export function MenuGrid({ categoryId, searchQuery }: MenuGridProps) {
  const { data: items, isLoading } = useMenuItems({
    category_id: categoryId || undefined,
    search: searchQuery || undefined,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-[#162a4a] border border-[#1e3a5f] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const filteredItems = items?.filter((item) => {
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  if (!filteredItems?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-cream/40">
        <p className="text-lg font-medium">No items found</p>
        <p className="text-sm mt-1">Try a different category or search term</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {filteredItems.map((item) => (
        <MenuItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
