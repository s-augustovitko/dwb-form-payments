import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

import Home from "./pages/home";
import Settings from "./pages/settings";
import CreateUpdateSettings from "./pages/settings/create_update";

export const routes: RouteDefinition[] = [
	{
		path: "/",
		component: Home,
	},
	{
		path: "/settings",
		children: [{
			path: "/",
			component: Settings,
		},
		{
			path: ":id",
			component: CreateUpdateSettings
		}]
	},

	{
		path: "**",
		component: lazy(() => import("./errors/404")),
	},
];
