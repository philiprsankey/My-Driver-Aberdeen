"use client";

import { useActionState, useState } from "react";

type AuthState = {
  error: string;
  values: Record<string, string>;
  attempt: number;
};
type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;

const fieldClass =
  "w-full border border-line bg-black px-4 py-3 text-ivory outline-none focus:border-gold";

const initialState: AuthState = { error: "", values: {}, attempt: 0 };

export function AccountForm({
  action,
  submitLabel,
  pendingLabel,
  fields,
}: {
  action: AuthAction;
  submitLabel: string;
  pendingLabel: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    autoComplete: string;
    defaultValue?: string;
  }>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  return (
    <form key={state.attempt} action={formAction} className="mt-8 space-y-5">
      {fields.map((field) => {
        const isPassword = field.type === "password";
        const shown = isPassword && visible[field.name] === true;
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="text-xs tracking-[0.18em] text-gold uppercase">
              {field.label}
            </label>
            <div className="relative mt-2">
              <input
                id={field.name}
                name={field.name}
                type={shown ? "text" : field.type}
                autoComplete={field.autoComplete}
                required
                defaultValue={state.attempt > 0 ? (state.values[field.name] ?? "") : (field.defaultValue ?? "")}
                className={isPassword ? `${fieldClass} pr-20` : fieldClass}
              />
              {isPassword ? (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-xs tracking-[0.14em] text-gold uppercase transition hover:text-gold-bright"
                  aria-pressed={shown}
                  aria-label={shown ? `Hide ${field.label.toLowerCase()}` : `Show ${field.label.toLowerCase()}`}
                  onClick={() =>
                    setVisible((current) => ({ ...current, [field.name]: !current[field.name] }))
                  }
                >
                  {shown ? "Hide" : "Show"}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      {state.error ? (
        <p role="alert" className="text-sm text-gold-bright">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center bg-gold px-6 text-sm font-medium tracking-[0.16em] text-black uppercase transition hover:bg-gold-bright disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
