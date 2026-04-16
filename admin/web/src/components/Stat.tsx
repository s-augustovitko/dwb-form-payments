import { Component } from "solid-js"

type Props = {
  title: string
  value: string | number
  desc?: string
  class?: string
}

export const Stat: Component<Props> = (props) => {
  return (
    <div class="stats border border-base-300 bg-base-200">
      <div class={`stat ${props.class || ''}`}>
        <div class="stat-title">
          {props.title}
        </div>

        <div class="stat-value">
          {props.value}
        </div>

        <div class="stat-desc">
          {props.desc}
        </div>
      </div>
    </div>
  )
}
