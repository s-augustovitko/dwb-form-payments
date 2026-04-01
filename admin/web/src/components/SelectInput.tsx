import { Component, For, JSX } from "solid-js"

export interface SelectItem {
  label: string
  value: string
}

type SelectProps = {
  name: string;
  value?: string;
  disabled?: boolean;

  ref: (element: HTMLSelectElement) => void;
  onInput: JSX.EventHandler<HTMLSelectElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLSelectElement, Event>;
  onBlur: JSX.EventHandler<HTMLSelectElement, FocusEvent>;
};

type InputProps = {
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
  value?: string;
  disabled?: boolean;

  ref: (element: HTMLInputElement) => void;
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLInputElement, Event>;
  onBlur: JSX.EventHandler<HTMLInputElement, FocusEvent>;
};

type Props = {
  label?: string;
  error: string;
  items: SelectItem[];
  required?: boolean;
  disabled?: boolean;

  select: SelectProps;
  input: InputProps;
}

export const SelectInput: Component<Props> = (props) => {
  const errorId = `${props.input.name}-error`

  return (
    <fieldset class="fieldset w-full">
      <label for={props.input.name} class="label">
        {props.label} {props.required ? <span>*</span> : <span>(Opcional)</span>}
      </label>


      <div class="join">
        <select
          {...props.select}
          value={props.select.value ?? ""}
          id={props.select.name}
          aria-invalid={!!props.error}
          aria-errormessage={errorId}
          class="select w-1/3 join-item"
          required={props.required}
          disabled={props.disabled}
        >
          <For each={props.items}>
            {(item) => (
              <option
                value={item.value} selected={item.value === props.select.value}
              >
                {item.label}
              </option>
            )}
          </For>
        </select>

        <input
          {...props.input}
          value={props.input.value ?? ""}
          id={props.input.name}
          placeholder={props.label}
          aria-invalid={!!props.error}
          aria-errormessage={errorId}
          class="input validator w-full join-item"
          required={props.required}
          disabled={props.disabled}
        />
      </div>

      {props.error && <div id={errorId} class="text-xs text-error mt-2">{props.error}</div>}
    </fieldset >
  )
}

