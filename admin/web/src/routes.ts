import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

import Home from "./pages/home";
import Settings from "./pages/settings";
import CreateSettings from "./pages/settings/create";

export const routes: RouteDefinition[] = [
	{
		path: "/",
		component: Home,
	},
	{
		path: "/settings",
		children: [{
			path: "",
			component: Settings,
		},
		{
			path: "/create",
			component: CreateSettings
			// {
			// 	path: "/:id",
			// 	component: UpdateSettings
		}]
	},

	{
		path: "**",
		component: lazy(() => import("./errors/404")),
	},
];
