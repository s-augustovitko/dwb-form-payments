import { Component, createUniqueId, For } from "solid-js"
import { createStore } from "solid-js/store"

export interface NotificationItem {
  id: string
  title: string
  type: "info" | "warning" | "error"
}

const createNotificationStore = () => {
  const [store, setStore] = createStore<Array<NotificationItem>>([])

  function removeItem(id: string) {
    setStore(items => items.filter(i => i.id !== id))
  }

  function addItem(item: Omit<NotificationItem, "id">) {
    const id = createUniqueId()

    const notification: NotificationItem = {
      id,
      ...item
    }

    setStore(store.length, notification)

    setTimeout(() => {
      removeItem(id)
    }, 5000)

    return id
  }

  return {
    getItems(): Array<NotificationItem> {
      return store
    },
    removeItem(id: string) {
      removeItem(id)
    },
    info(title: string) {
      return addItem({
        title,
        type: "info"
      })
    },
    warning(title: string) {
      return addItem({
        title,
        type: "warning"
      })
    },
    error(title: string) {
      return addItem({
        title,
        type: "error"
      })
    },
  }
}

export const notificationStore = createNotificationStore()

export const Toast: Component = () => {
  return (
    <div class="toast toast-top toast-center z-50">
      <For each={notificationStore.getItems()}>
        {(item) => (
          <div
            class="alert"
            classList={{
              "alert-info": item.type === "info",
              "alert-warning": item.type === "warning",
              "alert-error": item.type === "error"
            }}
            onclick={() => notificationStore.removeItem(item.id)}
          >
            <span>{item.title}</span>
          </div>
        )}
      </For>
    </div>
  )
}
