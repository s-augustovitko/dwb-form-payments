import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

import Form from "./pages/form";
import Success from "./pages/success";

export const routes: RouteDefinition[] = [
	{
		path: "/",
		component: Form,
	},
	{
		path: "/success",
		component: Success,
	},
	{
		path: "**",
		component: lazy(() => import("./errors/404")),
	},
];
