import { Loading, Toast } from "./components";
import { Suspense, type ParentComponent } from "solid-js";
import { MainLayout } from "./components";
import { FiBookOpen, FiFileText, FiGrid } from "solid-icons/fi";


const navItems = [
	{ path: "/", icon: FiGrid, label: "Dashboard" },
	{ path: "/forms", icon: FiFileText, label: "Forms" },
	{ path: "/articles", icon: FiBookOpen, label: "Articles" },
];

const App: ParentComponent = (props) => {
	return (
		<main>
			<Toast />

			<MainLayout title="DWB Admin" navItems={navItems}>
				<Suspense fallback={
					<div class="flex-1 bg-base-100">
						<div class="max-w-6xl mx-auto p-8">
							<Loading />
						</div>
					</div>
				}>{props.children}</Suspense>
			</MainLayout>
		</main>
	);
};

export default App;
