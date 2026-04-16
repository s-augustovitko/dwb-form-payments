import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

import Dashboard from "./pages/dashboard";
import Forms from "./pages/forms";
import CreateUpdateForm from "./pages/forms/create_update";

export const routes: RouteDefinition[] = [
	{
		path: "/",
		component: Dashboard,
	},
	{
		path: "/forms",
		children: [{
			path: "/",
			component: Forms,
		},
		{
			path: ":id", // /create for creating
			component: CreateUpdateForm
		}]
	},
	// {
	// 	path: "/articles",
	// 	children: [{
	// 		path: "/",
	// 		component: Articles,
	// 	},
	// 	{
	// 		path: ":id", // /create for creating
	// 		component: CreateUpdateArticle
	// 	}]
	// },
	{
		path: "**",
		component: lazy(() => import("./pages/404")),
	},
];
