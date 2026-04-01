import { Component, JSX, splitProps } from "solid-js";

type Props = {
  type?: "date"
  | "datetime-local"
  | "email"
  | "number"
  | "password"
  | "tel"
  | "text"
  | "time"
  inputmode?: "decimal"
  | "email"
  | "none"
  | "numeric"
  | "search"
  | "tel"
  | "text"
  | "url"

  name: string;
  required?: boolean;
  value?: string | number;

  label?: string;
  error: string;

  disabled?: boolean;

  ref: (element: HTMLInputElement) => void;
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLInputElement, Event>;
  onBlur: JSX.EventHandler<HTMLInputElement, FocusEvent>;
};


export const Input: Component<Props> = (props) => {
  const [, inputProps] = splitProps(props, ['label', 'error']);

  return (
    <fieldset class="fieldset">
      <label for={props.name} class="label">
        {props.label} {props.required ? <span>*</span> : <span>(Opcional)</span>}
      </label>

      <input
        {...inputProps}
        id={props.name}
        value={props.value ?? ""}
        placeholder={props.label}
        aria-invalid={!!props.error}
        aria-errormessage={`${props.name}-error`}
        class="input validator w-full"
      />

      {props.error && <div id={`${props.name}-error`} class="text-xs text-error mt-2">{props.error}</div>}
    </fieldset>
  );
}
