import { type Component, createResource, Suspense, Show, ErrorBoundary } from "solid-js";
import { Loading } from "../../components";
import MainForm from "./MainForm";
import { FormDataResponse } from "./types";
import { Method, request } from "../../utils/api";

async function getFormData(): Promise<FormDataResponse> {
	return request<FormDataResponse>("form_info", Method.GET)
}

const Form: Component = () => {
	const [formData] = createResource(getFormData)

	return (
		<ErrorBoundary
			fallback={(_) => (
				<div role="alert" class="alert alert-error text-lg">
					<p><strong>404</strong> - No hay cursos activos en este momento.</p>
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
