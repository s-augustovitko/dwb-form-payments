import { A, useLocation } from "@solidjs/router"
import { IconTypes } from "solid-icons";
import { FiMenu, FiX } from "solid-icons/fi";
import { ErrorBoundary, JSX, ParentComponent, Suspense } from "solid-js";
import { Loading } from "./Loading";

type LayoutProps = {
  title: string;
  navItems: NavItem[]
}

type NavItem = {
  path: string
  icon: IconTypes
  label: string
}

export const MainLayout: ParentComponent<LayoutProps> = (props) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path

  return (
    <div class="drawer lg:drawer-open">
      <input id="sidebar" type="checkbox" class="drawer-toggle" />

      <div class="drawer-content">
        <nav class="navbar bg-base-300 w-full lg:hidden">
          <label for="sidebar" class="btn btn-ghost drawer-button">
            <FiMenu />
          </label>

          <A href="/" class="text-xl font-bold btn btn-ghost">
            {props.title}
          </A>
        </nav>

        {props.children}
      </div>

      <div class="drawer-side">
        <label for="sidebar" aria-label="close sidebar" class="drawer-overlay"></label>

        <aside class="w-64 bg-base-300 border-r border-base-300 h-screen sticky top-0">
          <div class="p-6 flex items-center justify-between">
            <span class="text-xl font-bold lg:hidden">
              {props.title}
            </span>

            <A href="/" class="text-xl font-bold btn btn-ghost is-drawer-open:hidden">
              {props.title}
            </A>

            <label for="sidebar" class="btn btn-ghost drawer-button lg:hidden">
              <FiX />
            </label>
          </div>

          <nav class="px-4">
            {props.navItems.map((item) => {
              const Icon = item.icon;

              return (
                <A
                  href={item.path}
                  class="flex items-center gap-4 p-2 mb-2 rounded-lg hover:text-accent-content hover:bg-accent"
                  classList={{
                    "bg-primary text-primary-content  hover:text-primary-content/70 hover:bg-primary/70": isActive(item.path)
                  }}
                >
                  <Icon class="size-5" />
                  <span>{item.label}</span>
                </A>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  )
}

type PageProps = {
  title: string;
  subtitle?: string;
  actions?: JSX.Element | JSX.Element[];
}

export const PageLayout: ParentComponent<PageProps> = (props) => {
  return (
    <ErrorBoundary fallback={
      (err) => (
        <div class="flex-1 bg-base-100">
          <div class="max-w-6xl mx-auto p-8">
            <h1 class="text-3xl font-semibold">An Error Ocurred</h1>
            <p class="text-error">{err.message}</p>
          </div>
        </div>
      )
    }>
      <Suspense fallback={
        <div class="flex-1 bg-base-100">
          <div class="max-w-6xl mx-auto p-8">
            <Loading />
          </div>
        </div>
      }>
        <div class="flex-1 bg-base-100">
          <div class="max-w-6xl mx-auto p-8">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h1 class="text-3xl font-semibold">{props.title}</h1>
                <p class="text-base-content/50 mt-2">{props.subtitle}</p>
              </div>

              <div class="flex gap-2">
                {props.actions}
              </div>
            </div>

            <div class="w-full">
              {props.children}
            </div>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}
