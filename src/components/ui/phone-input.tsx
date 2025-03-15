'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from './input';
import {
  formatRussianPhoneNumber,
  normalizePhoneNumber,
} from '@/lib/validations';

export interface PhoneInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, error, onChange, value, ...props }, ref) => {
    const [inputValue, setInputValue] = useState<string>(
      value ? formatRussianPhoneNumber(value.toString()) : ''
    );

    useEffect(() => {
      if (value && typeof value === 'string') {
        setInputValue(formatRussianPhoneNumber(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const formattedValue = formatRussianPhoneNumber(rawValue);
      setInputValue(formattedValue);

      if (onChange) {
        // Создаем новый объект события с нормализованным значением
        const normalizedValue = normalizePhoneNumber(rawValue);
        const newEvent = {
          ...e,
          target: {
            ...e.target,
            value: normalizedValue,
          },
        };
        onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Разрешаем: Delete, Backspace, Tab, Escape, Enter, стрелки
      if (
        [
          'Delete',
          'Backspace',
          'Tab',
          'Escape',
          'Enter',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
        ].includes(e.key)
      ) {
        return;
      }

      // Разрешаем Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (
        (e.ctrlKey || e.metaKey) &&
        ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())
      ) {
        return;
      }

      // Запрещаем ввод нецифровых символов
      if (!/[0-9+() -]/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <div className="relative">
        <Input
          type="tel"
          className={className}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          ref={ref}
          placeholder="+7 (999) 123-45-67"
          {...props}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
