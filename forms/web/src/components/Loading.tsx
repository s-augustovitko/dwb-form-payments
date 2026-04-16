import { Component } from "solid-js"

export const Loading: Component = () => {
  return (
    <div class="flex flex-col w-full gap-4">
      <div class="skeleton h-12 w-64"></div>
      <div class="skeleton h-64 w-full"></div>
    </div>
  )
}

