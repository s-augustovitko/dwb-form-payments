import { type Component, createResource, Suspense, ErrorBoundary, Show } from "solid-js";
import { Loading } from "../../components";
import MainForm from "./MainForm";
import { FormDataResponse } from "./types";
import { Method, request } from "../../utils/api";

async function getFormData(): Promise<FormDataResponse> {
	try {
		const res = await request<FormDataResponse>("form_info", Method.GET)
		return res
	} catch (err) {
		throw err
	}
}

const Form: Component = () => {
	const [formData] = createResource(getFormData)

	return (
		<ErrorBoundary
			fallback={(_) => (
				<div role="alert" class="alert alert-error text-lg">
					<p><strong>404</strong> - Formulario invalido</p>
				</div>
			)}
		>
			<Suspense fallback={<Loading />}>
				<Show when={!!formData()}>
					<article class="mb-4">
						<h2 class="text-lg font-bold mb-2">{formData()?.settings?.title}</h2>
						<p>{formData()?.settings?.description}</p>
					</article>

					<MainForm {...formData()} />
				</Show>
			</Suspense>
		</ErrorBoundary>
	);
};

export default Form;
