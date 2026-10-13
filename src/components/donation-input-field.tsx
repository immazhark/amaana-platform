import type { InputHTMLAttributes, ReactNode } from "react";

type DonationInputFieldProps = {
  label: ReactNode;
  input: InputHTMLAttributes<HTMLInputElement> & { id: string; name: string };
  error?: string;
  errorId: string;
  className?: string;
  labelClassName?: string;
  controlClassName?: string;
  prefix?: ReactNode;
  hint?: ReactNode;
};

export function DonationInputField({ label, input, error, errorId, className = "field", labelClassName, controlClassName, prefix, hint }: DonationInputFieldProps) {
  const control = <input {...input}/>;
  return <div className={className}>
    <label className={labelClassName} htmlFor={input.id}>{label}</label>
    {controlClassName ? <div className={controlClassName}>{prefix}{control}</div> : control}
    {hint}
    {error && <small id={errorId} className="v2-field-error">{error}</small>}
  </div>;
}
