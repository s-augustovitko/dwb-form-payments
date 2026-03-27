import { Component, createUniqueId, Show } from "solid-js"
import { Field, ValidationFn } from "../utils"

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
  field: Field<any>
  validate?: () => ValidationFn<string>
}

export const Input: Component<Props> = (props) => {
  const id = createUniqueId()

  const applyValue = (val: string = "") => {
    props.field.set(val)
    props.field.setError(props.validate?.()(val) || props.field.validate?.())
  }

  return (
    <fieldset class={`fieldset ${props.class}`}>
      <label for={id} class="label">{props.title}</label>

      <input
        id={id}
        type={props.type || "text"}
        name={props.field.name}
        inputmode={props.inputmode || "text"}
        oninput={(e) => applyValue(e.currentTarget.value)}
        onchange={(e) => applyValue(e.currentTarget.value?.trim())}
        class="input validator w-full"
        placeholder={props.title}
        aria-invalid={!!props.field.error()}
        value={props.field.get()}
      />

      <Show when={!!props.field.error()}>
        <p class="text-xs text-error mt-2">{props.field.error()}</p>
      </Show>
    </fieldset>
  )
}
