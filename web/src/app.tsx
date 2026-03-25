import { Toast } from "./components";
import { type Component, Suspense } from "solid-js";

const App: Component<{ children: Element }> = (props) => {
	return (
		<main>
			<div class="max-w-xl p-4 mx-auto">
				<div class="bg-base-200 border border-base-300 rounded-box p-4">
					<Toast />
					<Suspense>{props.children}</Suspense>
				</div>
			</div>
		</main>
	);
};

export default App;
