import { Component, For, JSX, splitProps } from "solid-js"
import { SelectItem } from "./SelectInput"

type Props = {
  name: string;
  required?: boolean;
  value?: string;

  label?: string;
  error: string;
  items: SelectItem[]

  disabled?: boolean;

  ref: (element: HTMLSelectElement) => void;
  onInput: JSX.EventHandler<HTMLSelectElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLSelectElement, Event>;
  onBlur: JSX.EventHandler<HTMLSelectElement, FocusEvent>;
};

export const Select: Component<Props> = (props) => {
  const [, inputProps] = splitProps(props, ['label', 'error', 'items']);

  return (
    <fieldset class="fieldset w-full">
      <label for={props.name} class="label">
        {props.label} {props.required ? <span>*</span> : <span>(Opcional)</span>}
      </label>

      <select
        {...inputProps}
        id={props.name}
        aria-invalid={!!props.error}
        aria-errormessage={`${props.name}-error`}
        class="select validator w-full"
      >
        <For each={props.items}>
          {(item) => (
            <option
              value={item.value}
            >
              {item.label}
            </option>
          )}
        </For>
      </select>

      {props.error && <div id={`${props.name}-error`} class="text-xs text-error mt-2">{props.error}</div>}
    </fieldset>
  )
}
