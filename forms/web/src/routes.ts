import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

import Form from "./pages/form";
import Checkout from "./pages/checkout";
import Result from "./pages/result";

export const routes: RouteDefinition[] = [
	{
		path: "/",
		component: Form,
	},
	{
		path: "/checkout/:submission_id",
		component: Checkout,
	},
	{
		path: "/result/:submission_id",
		component: Result,
	},
	{
		path: "**",
		component: lazy(() => import("./pages/404")),
	},
];
