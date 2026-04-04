import { Component, For, JSX, splitProps } from "solid-js"

export interface MultiSelectItem {
  title: string
  subtitle: string
  value: string
}

type Props = {
  name: string;
  value?: string[];

  label?: string;
  error: string;
  items: MultiSelectItem[]

  disabled?: boolean;

  ref: (element: HTMLInputElement) => void;
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLInputElement, Event>;
  onBlur: JSX.EventHandler<HTMLInputElement, FocusEvent>;
};

export const MultiSelect: Component<Props> = (props) => {
  const [, inputProps] = splitProps(props, ['label', 'error', 'items']);

  return (
    <fieldset class="fieldset">
      <label class="label">
        {props.label}
      </label>

      <For each={props.items}>
        {({ title, subtitle, value }) => {
          return (
            <label class="label truncate cursor-pointer gap-3">
              <input
                {...inputProps}
                id={`${props.name}−${value}`}
                type="checkbox"
                class="toggle toggle-success"
                disabled={props.disabled}
                checked={props.value?.includes(value)}
                value={value}
                aria-invalid={!!props.error}
                aria-errormessage={`${props.name}-error`}
              />

              <div>
                <strong>{subtitle}</strong>
                <p>{title}</p>
              </div>
            </label>
          )
        }}
      </For>

      {props.error && <div id={`${props.name}-error`} class="text-xs text-error mt-2">{props.error}</div>}
    </fieldset>
  );
}
