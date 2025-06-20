import { type HTMLProps, type ReactNode, useId } from 'react';
import s from './select.module.css';

export interface SelectProps extends HTMLProps<'select'> {
  children: ReactNode;
  options: { label: ReactNode; value: string }[];
}

export function Select({ children, options, ...props }: SelectProps) {
  const id = useId();
  return (
    <div className={s.container}>
      <label htmlFor={id} className={s.label}>
        {children}
      </label>
      <select {...props} id={id}>
        {options.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
