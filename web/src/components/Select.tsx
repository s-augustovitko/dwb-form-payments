import { Component, createUniqueId, For, Show } from "solid-js"
import { Field, ValidationFn } from "../utils"
import { SelectItem } from "./SelectInput"

interface Props {
  class?: string

  title: string
  field: Field<string>
  items: SelectItem[]
  validate?: () => ValidationFn<string>
  disabled?: () => boolean
}

export const Select: Component<Props> = (props) => {
  const id = createUniqueId()

  const applyValue = (val: string = "") => {
    props.field.set(val)
    props.field.setError(props.validate?.()(val) || props.field.validate?.())
  }

  return (
    <fieldset class={`fieldset ${props.class}`}>
      <label for={id} class="label">{props.title}</label>

      <select
        id={id}
        name={props.field.name}
        oninput={(e) => applyValue(e.currentTarget.value)}
        class="select w-full"
        aria-invalid={!!props.field.error()}
        value={props.field.get()}
        disabled={props.disabled?.()}
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

      <Show when={!!props.field.error()}>
        <p class="text-xs text-error mt-2">{props.field.error()}</p>
      </Show>
    </fieldset>
  )
}
