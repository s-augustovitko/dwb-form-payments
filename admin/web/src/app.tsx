import { FiMenu } from "solid-icons/fi";
import { Toast } from "./components";
import { Suspense, type ParentComponent } from "solid-js";
import { A } from "@solidjs/router";

const App: ParentComponent = (props) => {
	return (
		<main>
			<Toast />

			<div class="navbar bg-base-100 shadow-sm">
				<div class="navbar-start">
					<div class="dropdown">
						<button tabIndex={0} class="btn btn-ghost btn-circle">
							<FiMenu />
						</button>
						<ul
							tabIndex={-1}
							class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
							<li><A href="/">Inicio</A></li>
							<li><A href="/settings">Ajustes</A></li>
						</ul>
					</div>

					<A href="/" class="btn btn-ghost text-xl">Administrador DWB</A>
				</div>
			</div>

			<div class="max-w-[1000px] p-4 my-4 mx-auto">
				<div class="bg-base-200 border border-base-300 rounded-box p-4">
					<Suspense>{props.children}</Suspense>
				</div>
			</div>
		</main>
	);
};

export default App;
