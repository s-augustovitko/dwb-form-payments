import { ParentComponent, Show } from "solid-js"

type Props = {
  title?: string
  footer?: string
  class?: string
}

export const Card: ParentComponent<Props> = (props) => {
  return (
    <div class="card border border-base-300 bg-base-200">
      <div class={`card-body gap-4 ${props.class || ''}`}>
        <Show when={props.title}>
          <p class="text-sm text-base-content/50 flex-none">{props.title}</p>
        </Show>
        {props.children}
        <Show when={props.footer}>
          <p class="text-sm text-base-content/50">{props.footer}</p>
        </Show>
      </div>
    </div>
  )
}


