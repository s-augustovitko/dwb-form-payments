import { Toast } from "./components";
import { type ParentComponent } from "solid-js";

const App: ParentComponent = (props) => {
	return (
		<main>
			<Toast />

			<div class="max-w-xl p-4 mx-auto">
				{props.children}
			</div>
		</main>
	);
};

export default App;
