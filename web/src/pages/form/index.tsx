import { type Component, createResource, Suspense, ErrorBoundary, Show } from "solid-js";
import { Loading, notificationStore } from "../../components";
import MainForm from "./MainForm";
import { FormDataResponse } from "./types";
import { Method, request } from "../../utils/api";

async function getFormData(): Promise<FormDataResponse> {
	try {
		const res = await request<FormDataResponse>("form_info", Method.GET)
		return res
	} catch (err) {
		notificationStore.error((err as any).message)
		throw err
	}
}

const Form: Component = () => {
	const [formData] = createResource(getFormData)

	return (
		<ErrorBoundary
			fallback={(_) => (
				<article class="mb-4">
					<h2 class="text-lg font-bold mb-2">404</h2>
					<p>No hay cursos activos en este momento, por favor intente en otro momento.</p>
				</article>
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
