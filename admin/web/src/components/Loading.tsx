import { Component } from "solid-js"

export const Loading: Component = () => {
  return (
    <div class="flex flex-col w-full gap-4">
      <div class="skeleton h-6 w-32"></div>
      <div class="skeleton h-32 w-full"></div>
    </div>
  )
}

