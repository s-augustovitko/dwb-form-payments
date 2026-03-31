import { Component, For, Show } from "solid-js"
import { Field, ValidationFn } from "../utils"

export interface MultiSelectItem {
  title: string
  subtitle: string
  value: string
}

interface Props {
  class?: string
  title: string
  field: Field<string[]>
  items: () => MultiSelectItem[]
  validate?: () => ValidationFn<string[]>
  disabled?: () => boolean
}

export const MultiSelect: Component<Props> = (props) => {
  const toggleValue = (val: string, checked: boolean) => {
    const current = props.field.get() || []

    const next = checked
      ? [...current, val]
      : current.filter((v) => v !== val)

    props.field.set(next)
    props.field.setError(
      props.validate?.()(next) || props.field.validate?.()
    )
  }


  const isChecked = (value: string) =>
    (props.field.get() || []).includes(value)

  return (
    <fieldset class={`fieldset ${props.class ?? ""}`}>
      <label class="label">{props.title}</label>

      <For each={props.items()}>
        {({ title, subtitle, value }) => {
          return (
            <label class="label truncate cursor-pointer gap-3">
              <input
                name={props.field.name}
                type="checkbox"
                class="toggle toggle-success"
                value={value}
                checked={isChecked(value)}
                onChange={(e) =>
                  toggleValue(value, e.currentTarget.checked)
                }
                aria-invalid={!!props.field.error()}
                disabled={props.disabled?.()}
              />

              <div>
                <strong>{subtitle}</strong>
                <p>{title}</p>
              </div>
            </label>
          )
        }}
      </For>

      <Show when={!!props.field.error()}>
        <p class="text-xs text-error mt-2">
          {props.field.error()}
        </p>
      </Show>
    </fieldset>
  )
}
