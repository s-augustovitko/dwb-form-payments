import { Component, createUniqueId, For, Show } from "solid-js"
import { Field, ValidationFn } from "../utils"


export interface SelectItem {
  label: string
  value: string
}

interface Props {
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
  class?: string

  title: string
  fieldInput: Field<string>

  fieldSelect: Field<string>
  itemsSelect: SelectItem[]

  validateInput?: () => ValidationFn<string>
  validateSelect?: () => ValidationFn<string>
  disabled?: () => boolean
}

export const SelectInput: Component<Props> = (props) => {
  const id = createUniqueId()
  const error = () => props.fieldInput.error() || props.fieldSelect.error()

  const applyValue = (key: "fieldInput" | "fieldSelect", val: string = "") => {
    props[key].set(val)

    props.fieldInput.setError(props.validateInput?.()(props.fieldInput.get()) || props.fieldInput.validate?.())
    props.fieldSelect.setError(props.validateSelect?.()(props.fieldSelect.get()) || props.fieldSelect.validate?.())
  }

  return (
    <fieldset class={`fieldset ${props.class}`}>
      <label for={id} class="label">{props.title}</label>

      <div class="join">
        <select
          name={props.fieldSelect.name}
          oninput={(e) => applyValue("fieldSelect", e.currentTarget.value)}
          class="select w-1/3 join-item"
          aria-invalid={!!props.fieldSelect.error()}
          value={props.fieldSelect.get()}
          disabled={props.disabled?.()}
        >
          <For each={props.itemsSelect}>
            {(item) => (
              <option
                value={item.value}
              >
                {item.label}
              </option>
            )}
          </For>
        </select>

        <input
          id={id}
          type={props.type || "text"}
          name={props.fieldInput.name}
          oninput={(e) => applyValue("fieldInput", e.currentTarget.value)}
          onchange={(e) => applyValue("fieldInput", e.currentTarget.value?.trim())}
          class="input validator w-full"
          placeholder={props.title}
          aria-invalid={!!props.fieldInput.error()}
          value={props.fieldInput.get()}
          inputmode={props.inputmode || "text"}
          disabled={props.disabled?.()}
        />
      </div>

      <Show when={!!error()}>
        <p class="text-xs text-error mt-2">{error()}</p>
      </Show>
    </fieldset>
  )
}
