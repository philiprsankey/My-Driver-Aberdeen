"use client";

import { useActionState } from "react";

type VerifyState = { error: string; code: string; attempt: number };
type VerifyAction = (state: VerifyState, formData: FormData) => Promise<VerifyState>;
type ResendState = { error: string; notice: string };
type ResendAction = (state: ResendState, formData: FormData) => Promise<ResendState>;

const initialVerify: VerifyState = { error: "", code: "", attempt: 0 };
const initialResend: ResendState = { error: "", notice: "" };

export function VerifyCodeForm({
  confirmAction,
  resendAction,
}: {
  confirmAction: VerifyAction;
  resendAction: ResendAction;
}) {
  const [confirmState, confirmForm, confirming] = useActionState(confirmAction, initialVerify);
  const [resendState, resendForm, resending] = useActionState(resendAction, initialResend);
  const message = confirmState.error || resendState.error;

  return (
    <div className="mt-8 space-y-5">
      <form key={confirmState.attempt} action={confirmForm} className="space-y-5">
        <div>
          <label htmlFor="code" className="text-xs tracking-[0.18em] text-gold uppercase">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            required
            defaultValue={confirmState.code}
            spellCheck={false}
            onChange={(event) => {
              event.target.value = event.target.value.replace(/\D/g, "").slice(0, 6);
            }}
            className="mt-2 w-full border border-line bg-black px-4 py-3 text-center font-display text-3xl tracking-[0.28em] text-ivory outline-none focus:border-gold"
          />
        </div>
        {message ? (
          <p role="alert" className="text-sm text-gold-bright">
            {message}
          </p>
        ) : null}
        {resendState.notice ? <p className="text-sm text-muted">{resendState.notice}</p> : null}
        <button
          type="submit"
          disabled={confirming}
          className="inline-flex min-h-12 w-full items-center justify-center bg-gold px-6 text-sm font-medium tracking-[0.16em] text-black uppercase transition hover:bg-gold-bright disabled:opacity-60"
        >
          {confirming ? "Checking code" : "Confirm code"}
        </button>
      </form>
      <form action={resendForm}>
        <button
          type="submit"
          disabled={resending}
          className="text-sm text-gold transition hover:text-gold-bright disabled:opacity-60"
        >
          {resending ? "Sending a new code" : "Send a new code"}
        </button>
      </form>
    </div>
  );
}
