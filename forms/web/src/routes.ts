import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

import Form from "./pages/form";
import Result from "./pages/result";

export const routes: RouteDefinition[] = [
	{
		path: "/",
		component: Form,
	},
	{
		path: "/result",
		component: Result,
	},
	{
		path: "**",
		component: lazy(() => import("./errors/404")),
	},
];
