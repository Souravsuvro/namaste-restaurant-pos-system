import { Delete } from 'lucide-react';

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  showDecimal?: boolean;
}

export function NumPad({ value, onChange, onEnter, showDecimal = true }: NumPadProps) {
  const handlePress = (digit: string) => {
    if (digit === '.' && value.includes('.')) return;
    if (digit === '.' && value === '') {
      onChange('0.');
      return;
    }
    onChange(value + digit);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const buttons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    showDecimal ? '.' : '',
    '0',
    'backspace',
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map((btn, index) => {
        if (btn === 'backspace') {
          return (
            <button
              key={index}
              onClick={handleBackspace}
              className="h-14 rounded-xl bg-[#0f1f3d] border border-[#1e3a5f] flex items-center justify-center text-cream/70 hover:bg-[#162a4a] hover:text-cream active:bg-[#1a3052] transition-colors"
            >
              <Delete size={22} />
            </button>
          );
        }
        if (btn === '') {
          return <div key={index} />;
        }
        return (
          <button
            key={index}
            onClick={() => handlePress(btn)}
            className="h-14 rounded-xl bg-[#0f1f3d] border border-[#1e3a5f] flex items-center justify-center text-xl font-semibold text-cream hover:bg-[#162a4a] active:bg-[#1a3052] transition-colors"
          >
            {btn}
          </button>
        );
      })}
      {onEnter && (
        <button
          onClick={onEnter}
          className="col-span-3 h-14 rounded-xl bg-saffron text-white font-bold text-lg hover:bg-saffron/90 active:bg-saffron/80 transition-colors mt-2"
        >
          Enter
        </button>
      )}
    </div>
  );
}
