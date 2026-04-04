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
  value?: string;

  label?: string;
  error: string;

  disabled?: boolean;

  ref: (element: HTMLTextAreaElement) => void;
  onInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLTextAreaElement, Event>;
  onBlur: JSX.EventHandler<HTMLTextAreaElement, FocusEvent>;
};


export const TextArea: Component<Props> = (props) => {
  const [, inputProps] = splitProps(props, ['label', 'error']);

  return (
    <fieldset class="fieldset">
      <label for={props.name} class="label">
        {props.label} {props.required ? <span>*</span> : <span>(Opcional)</span>}
      </label>

      <textarea
        {...inputProps}
        value={props.value ?? ""}
        id={props.name}
        placeholder={props.label}
        aria-invalid={!!props.error}
        aria-errormessage={`${props.name}-error`}
        class="textarea validator w-full"
      />

      {props.error && <div id={`${props.name}-error`} class="text-xs text-error mt-2">{props.error}</div>}
    </fieldset>
  );
}

