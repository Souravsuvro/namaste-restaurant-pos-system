import { useState } from 'react';
import { Users, Equal, List, Percent } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/cart-store';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

type SplitMode = 'equal' | 'by_item' | 'by_percentage';

export function SplitBillModal({ isOpen, onClose, total }: SplitBillModalProps) {
  const [mode, setMode] = useState<SplitMode>('equal');
  const [splitWays, setSplitWays] = useState(2);
  const { items } = useCartStore();
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [percentages, setPercentages] = useState<number[]>([50, 50]);

  const perPerson = total / splitWays;

  const toggleItemAssignment = (itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) + 1) % (splitWays + 1),
    }));
  };

  const updatePercentage = (index: number, value: number) => {
    const newPercentages = [...percentages];
    newPercentages[index] = value;
    setPercentages(newPercentages);
  };

  const handleSplitWaysChange = (ways: number) => {
    setSplitWays(ways);
    setPercentages(Array.from({ length: ways }, () => Math.floor(100 / ways)));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Split Bill" size="md">
      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('equal')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
            mode === 'equal'
              ? 'bg-saffron/20 border-saffron/50 text-saffron'
              : 'bg-[#0f1f3d] border-[#1e3a5f] text-cream/60 hover:border-cream/30'
          }`}
        >
          <Equal size={16} />
          Equal
        </button>
        <button
          onClick={() => setMode('by_item')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
            mode === 'by_item'
              ? 'bg-saffron/20 border-saffron/50 text-saffron'
              : 'bg-[#0f1f3d] border-[#1e3a5f] text-cream/60 hover:border-cream/30'
          }`}
        >
          <List size={16} />
          By Item
        </button>
        <button
          onClick={() => setMode('by_percentage')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
            mode === 'by_percentage'
              ? 'bg-saffron/20 border-saffron/50 text-saffron'
              : 'bg-[#0f1f3d] border-[#1e3a5f] text-cream/60 hover:border-cream/30'
          }`}
        >
          <Percent size={16} />
          Percentage
        </button>
      </div>

      {/* Equal split */}
      {mode === 'equal' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-cream/60" />
            <span className="text-sm text-cream/60">Split between</span>
          </div>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => handleSplitWaysChange(n)}
                className={`flex-1 py-4 rounded-xl border text-lg font-bold transition-all ${
                  splitWays === n
                    ? 'bg-saffron/20 border-saffron/50 text-saffron'
                    : 'bg-[#0f1f3d] border-[#1e3a5f] text-cream/60 hover:border-cream/30'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-[#0f1f3d] border border-[#1e3a5f] text-center">
            <p className="text-sm text-cream/60 mb-1">Each person pays</p>
            <p className="text-3xl font-bold text-saffron">
              {'\u20AC'}{perPerson.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* By item */}
      {mode === 'by_item' && (
        <div className="space-y-3">
          <p className="text-xs text-cream/40 mb-2">
            Tap items to assign them to different bills (cycle through bill numbers)
          </p>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItemAssignment(item.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0f1f3d] border border-[#1e3a5f] hover:border-cream/30 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-cream">{item.menuItem.name}</p>
                <p className="text-xs text-cream/40">
                  {item.quantity}x {'\u20AC'}{item.menuItem.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-cream">
                  {'\u20AC'}{(item.menuItem.price * item.quantity).toFixed(2)}
                </span>
                {selectedItems[item.id] !== undefined && selectedItems[item.id] > 0 && (
                  <span className="w-6 h-6 rounded-full bg-saffron text-white text-xs font-bold flex items-center justify-center">
                    {selectedItems[item.id]}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* By percentage */}
      {mode === 'by_percentage' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-cream/60">Number of splits:</span>
            <div className="flex gap-1">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => handleSplitWaysChange(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                    splitWays === n
                      ? 'bg-saffron text-white'
                      : 'bg-[#0f1f3d] border border-[#1e3a5f] text-cream/60'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {percentages.slice(0, splitWays).map((pct, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-cream/60 w-16">Person {i + 1}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={pct}
                onChange={(e) => updatePercentage(i, parseInt(e.target.value))}
                className="flex-1 accent-saffron"
              />
              <span className="text-sm font-medium text-cream w-12 text-right">{pct}%</span>
              <span className="text-sm text-saffron w-20 text-right">
                {'\u20AC'}{((total * pct) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Button variant="ghost" size="lg" className="flex-1 border border-[#1e3a5f]" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={onClose}>
          Apply Split
        </Button>
      </div>
    </Modal>
  );
}
