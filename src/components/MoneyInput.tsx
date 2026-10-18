import { useEffect, useRef, useState } from 'react';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  label?: string;
  invalid?: boolean;
  className?: string;
}

/** Peso input that lets you clear the field instead of snapping back to 0. */
export function MoneyInput({ value, onChange, id, label, invalid, className = '' }: MoneyInputProps) {
  const [text, setText] = useState(value ? String(value) : '');
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(value ? String(value) : '');
  }, [value]);

  return (
    <div className={`money-field ${className}`}>
      <span className="money-field__prefix" aria-hidden="true">₱</span>
      <input
      id={id}
      aria-label={label}
      className={`input tabular money-input${invalid ? ' input--invalid' : ''}`}
      inputMode="decimal"
      placeholder="0"
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setText(value ? String(value) : '');
      }}
      onChange={(e) => {
        const t = e.target.value;
        if (!/^\d*\.?\d{0,2}$/.test(t)) return;
        setText(t);
        onChange(t === '' || t === '.' ? 0 : parseFloat(t));
      }}
      />
    </div>
  );
}
