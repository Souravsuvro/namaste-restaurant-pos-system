import { useCategories } from '@/hooks/useMenu';

interface CategoryBarProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryBar({ selectedCategory, onSelectCategory }: CategoryBarProps) {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        onClick={() => onSelectCategory(null)}
        className={`
          flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium
          transition-all duration-200 min-h-[44px]
          ${
            selectedCategory === null
              ? 'bg-saffron text-white shadow-lg shadow-saffron/30'
              : 'bg-[#162a4a] text-cream/70 hover:bg-[#1a3052] border border-[#1e3a5f]'
          }
        `}
      >
        All
      </button>
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-24 h-[44px] rounded-full bg-[#162a4a] animate-pulse"
            />
          ))
        : categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`
                flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium
                transition-all duration-200 min-h-[44px] whitespace-nowrap
                ${
                  selectedCategory === category.id
                    ? 'bg-saffron text-white shadow-lg shadow-saffron/30'
                    : 'bg-[#162a4a] text-cream/70 hover:bg-[#1a3052] border border-[#1e3a5f]'
                }
              `}
            >
              {category.name}
            </button>
          ))}
    </div>
  );
}
