import { type HTMLProps, type ReactNode, useId } from 'react';
import s from './select.module.css';

export interface SelectProps
  extends Omit<HTMLProps<'select'>, 'children' | 'label'> {
  label: ReactNode;
  options: { label: ReactNode; value: string }[];
}

export function Select({ label, options, ...props }: SelectProps) {
  const id = useId();
  return (
    <div className={s.container}>
      <label htmlFor={id} className={s.label}>
        {label}
      </label>
      <select className={s.select} {...props} id={id}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
