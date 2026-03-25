import { Component } from "solid-js"

export const Loading: Component = () => {
  return (
    <div class="flex flex-col w-full gap-4">
      <div class="skeleton h-6 w-32"></div>
      <div class="skeleton h-4 w-full"></div>
      <div class="skeleton h-4 w-full"></div>
      <div class="skeleton h-4 w-full mb-4"></div>
      <div class="skeleton h-2 w-32"></div>
      <div class="skeleton h-8 w-full"></div>
      <div class="skeleton h-2 w-32"></div>
      <div class="skeleton h-8 w-full"></div>
      <div class="skeleton h-2 w-32"></div>
      <div class="skeleton h-8 w-full"></div>
      <div class="skeleton h-2 w-32"></div>
      <div class="skeleton h-8 w-full"></div>
      <div class="skeleton h-2 w-32"></div>
      <div class="skeleton h-8 w-full"></div>
      <div class="skeleton h-8 w-full mt-4"></div>
    </div>
  )
}
