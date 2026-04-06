import { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Receipt, Percent, Split } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { NumPad } from './NumPad';
import { SplitBillModal } from './SplitBillModal';
import { DiscountModal } from './DiscountModal';
import { useCartStore } from '@/store/cart-store';
import type { PaymentMethod } from '@/types/order';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (method: PaymentMethod, amountTendered: number, tip: number) => void;
}

export function PaymentModal({ isOpen, onClose, onComplete }: PaymentModalProps) {
  const { getTotal, getSubtotal, getTax, getDiscountAmount, items } = useCartStore();
  const total = getTotal();
  const subtotal = getSubtotal();
  const tax = getTax();
  const discountAmount = getDiscountAmount();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amountTendered, setAmountTendered] = useState('');
  const [tip, setTip] = useState(0);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [step, setStep] = useState<'method' | 'cash' | 'tip' | 'confirm'>('method');

  const totalWithTip = total + tip;
  const change =
    selectedMethod === 'cash' ? Math.max(0, parseFloat(amountTendered || '0') - totalWithTip) : 0;

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === 'cash') {
      setStep('cash');
    } else {
      setStep('tip');
    }
  };

  const handleTipSelect = (percentage: number) => {
    setTip(total * (percentage / 100));
  };

  const handleCustomTip = (value: string) => {
    setTip(parseFloat(value) || 0);
  };

  const handleComplete = () => {
    if (!selectedMethod) return;
    const tendered = selectedMethod === 'cash' ? parseFloat(amountTendered || '0') : totalWithTip;
    onComplete(selectedMethod, tendered, tip);
  };

  const handleReset = () => {
    setSelectedMethod(null);
    setAmountTendered('');
    setTip(0);
    setStep('method');
  };

  const quickCashAmounts = [10, 20, 50, 100].filter((a) => a >= totalWithTip);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          handleReset();
          onClose();
        }}
        title="Payment"
        size="lg"
      >
        {/* Order summary */}
        <div className="mb-6 p-4 rounded-xl bg-[#0f1f3d] border border-[#1e3a5f]">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-cream/60">
              <span>{items.length} item(s)</span>
              <span>{'\u20AC'}{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>-{'\u20AC'}{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-cream/60">
              <span>TVA (10%)</span>
              <span>{'\u20AC'}{tax.toFixed(2)}</span>
            </div>
            {tip > 0 && (
              <div className="flex justify-between text-gold">
                <span>Tip</span>
                <span>{'\u20AC'}{tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-cream pt-2 border-t border-[#1e3a5f]">
              <span>Total</span>
              <span className="text-saffron">{'\u20AC'}{totalWithTip.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Step: Method Selection */}
        {step === 'method' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-cream/60 mb-3">Select Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSelectMethod('cash')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#0f1f3d] border border-[#1e3a5f] hover:border-saffron/50 hover:bg-[#162a4a] transition-all"
              >
                <Banknote size={36} className="text-emerald-400" />
                <span className="text-sm font-medium text-cream">Cash</span>
              </button>
              <button
                onClick={() => handleSelectMethod('card')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#0f1f3d] border border-[#1e3a5f] hover:border-saffron/50 hover:bg-[#162a4a] transition-all"
              >
                <CreditCard size={36} className="text-blue-400" />
                <span className="text-sm font-medium text-cream">Card</span>
              </button>
              <button
                onClick={() => handleSelectMethod('mobile')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#0f1f3d] border border-[#1e3a5f] hover:border-saffron/50 hover:bg-[#162a4a] transition-all"
              >
                <Smartphone size={36} className="text-purple-400" />
                <span className="text-sm font-medium text-cream">Mobile</span>
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="ghost"
                size="lg"
                icon={<Split size={16} />}
                onClick={() => setShowSplitBill(true)}
                className="flex-1 border border-[#1e3a5f]"
              >
                Split Bill
              </Button>
              <Button
                variant="ghost"
                size="lg"
                icon={<Percent size={16} />}
                onClick={() => setShowDiscount(true)}
                className="flex-1 border border-[#1e3a5f]"
              >
                Discount
              </Button>
            </div>
          </div>
        )}

        {/* Step: Cash Input */}
        {step === 'cash' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cream/60">Amount Tendered</h3>
              <button onClick={() => setStep('method')} className="text-xs text-saffron hover:underline">
                Change method
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-cream">
                {'\u20AC'}{amountTendered || '0.00'}
              </div>
              {parseFloat(amountTendered || '0') >= totalWithTip && (
                <div className="text-lg text-emerald-400 mt-2">
                  Change: {'\u20AC'}{change.toFixed(2)}
                </div>
              )}
            </div>

            {quickCashAmounts.length > 0 && (
              <div className="flex gap-2 mb-3">
                {quickCashAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setAmountTendered(String(amount))}
                    className="flex-1 py-2 rounded-lg bg-indigo/30 border border-indigo/50 text-cream text-sm font-medium hover:bg-indigo/50 transition-colors"
                  >
                    {'\u20AC'}{amount}
                  </button>
                ))}
                <button
                  onClick={() => setAmountTendered(totalWithTip.toFixed(2))}
                  className="flex-1 py-2 rounded-lg bg-saffron/20 border border-saffron/40 text-saffron text-sm font-medium hover:bg-saffron/30 transition-colors"
                >
                  Exact
                </button>
              </div>
            )}

            <NumPad value={amountTendered} onChange={setAmountTendered} />

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setStep('tip')}
              disabled={parseFloat(amountTendered || '0') < totalWithTip}
              className="mt-4"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step: Tip */}
        {step === 'tip' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cream/60">Add a Tip?</h3>
              <button onClick={() => setStep('method')} className="text-xs text-saffron hover:underline">
                Change method
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[0, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => (pct === 0 ? setTip(0) : handleTipSelect(pct))}
                  className={`
                    py-3 rounded-xl border text-sm font-medium transition-all
                    ${
                      (pct === 0 && tip === 0) ||
                      (pct > 0 && Math.abs(tip - total * (pct / 100)) < 0.01)
                        ? 'bg-gold/20 border-gold/50 text-gold'
                        : 'bg-[#0f1f3d] border-[#1e3a5f] text-cream/60 hover:border-gold/30'
                    }
                  `}
                >
                  {pct === 0 ? 'No Tip' : `${pct}%`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-cream/60">Custom:</span>
              <input
                type="number"
                value={tip > 0 ? tip.toFixed(2) : ''}
                onChange={(e) => handleCustomTip(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-cream text-sm focus:outline-none focus:border-saffron/50"
              />
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" size="lg" className="flex-1 border border-[#1e3a5f]">
                <Receipt size={16} className="mr-2" />
                Preview Receipt
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleComplete}
              >
                Complete {'\u20AC'}{totalWithTip.toFixed(2)}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <SplitBillModal
        isOpen={showSplitBill}
        onClose={() => setShowSplitBill(false)}
        total={total}
      />
      <DiscountModal
        isOpen={showDiscount}
        onClose={() => setShowDiscount(false)}
      />
    </>
  );
}
