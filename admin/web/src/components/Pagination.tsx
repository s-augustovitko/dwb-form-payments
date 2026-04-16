import { Accessor, Component, For, Setter } from "solid-js"

interface Props {
  page: Accessor<number>;
  totalPages: Accessor<number>
  setPage: Setter<number>;
}

export const Pagination: Component<Props> = (props) => {
  function getPagination(current: number, total: number) {
    if (total <= 0) return []

    const delta = 2;
    const range: (number | string)[] = [];

    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);

    if (left > 2) {
      range.push("...");
    }

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (right < total - 1) {
      range.push("...");
    }

    if (total > 1) {
      range.push(total);
    }

    return range;
  }

  const pages = () =>
    getPagination(props.page(), props.totalPages());

  return (
    <>
      {pages().length > 0 ? <div class="divider my-4" /> : undefined}

      <div class="join mx-auto w-full">
        <For each={pages()}>
          {(p) => (
            <button
              class="join-item btn"
              classList={{
                "btn-active": p === props.page(),
                "btn-disabled": p === "...",
              }}
              disabled={p === "..."}
              onClick={() => typeof p === "number" && props.setPage(p)}
            >
              {p}
            </button>
          )}
        </For>
      </div>
    </>
  );
}
