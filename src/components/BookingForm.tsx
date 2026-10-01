"use client";

import { useActionState } from "react";

type BookingState = {
  error: string;
  values: Record<string, string>;
  attempt: number;
};
type BookingAction = (state: BookingState, formData: FormData) => Promise<BookingState>;

const fieldClass =
  "mt-2 w-full border border-line bg-black px-4 py-3 text-ivory outline-none placeholder:text-muted/70 focus:border-gold";
const initialState: BookingState = { error: "", values: {}, attempt: 0 };

export function BookingForm({ action, minDate, maxDate }: { action: BookingAction; minDate: string; maxDate: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form key={state.attempt} action={formAction} className="mt-6 space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="text-xs tracking-[0.18em] text-gold uppercase">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            min={minDate}
            max={maxDate}
            defaultValue={state.values.date ?? ""}
            className={`${fieldClass} scheme-dark`}
          />
        </div>
        <div>
          <label htmlFor="time" className="text-xs tracking-[0.18em] text-gold uppercase">
            Time
          </label>
          <input
            id="time"
            name="time"
            type="time"
            required
            defaultValue={state.values.time ?? ""}
            className={`${fieldClass} scheme-dark`}
          />
        </div>
      </div>
      <div>
        <label htmlFor="pickup" className="text-xs tracking-[0.18em] text-gold uppercase">
          Pickup
        </label>
        <input
          id="pickup"
          name="pickup"
          type="text"
          required
          autoComplete="off"
          placeholder="Aberdeen Airport"
          defaultValue={state.values.pickup ?? ""}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="destination" className="text-xs tracking-[0.18em] text-gold uppercase">
          Destination
        </label>
        <input
          id="destination"
          name="destination"
          type="text"
          required
          autoComplete="off"
          placeholder="Marischal College, Broad Street"
          defaultValue={state.values.destination ?? ""}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="note" className="text-xs tracking-[0.18em] text-gold uppercase">
          Note
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          placeholder="Flight number, or anything we should know"
          defaultValue={state.values.note ?? ""}
          className={fieldClass}
        />
      </div>
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
        {pending ? "Requesting hire" : "Request hire"}
      </button>
    </form>
  );
}
