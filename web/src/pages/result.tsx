import { A, useSearchParams } from "@solidjs/router";
import { createResource, ErrorBoundary, Show, type Component } from "solid-js";
import { Method, request } from "../utils";

interface FormResponseData {
	first_name: string;
	payment_status: string;
	payment_id: string;
	email: string;
}

async function getFormResponse(form_id: string): Promise<FormResponseData> {
	try {
		if (!form_id) throw new Error("Formulario invalido")

		const res = await request<FormResponseData>(`form_response?form_id=${form_id}`, Method.GET)
		return res
	} catch (err) {
		throw err
	}
}

const Result: Component = () => {
	const [searchParams, _] = useSearchParams<{ form_id?: string }>();
	const [formResponse] = createResource(
		() => searchParams.form_id,
		(id) => getFormResponse(id),
	)

	const isSuccess = () => formResponse()?.payment_status === 'SUCCESS' || formResponse()?.payment_status === 'NOT_NEEDED'

	const hasPayment = () => formResponse()?.payment_status === 'SUCCESS'

	const handleScreenshot = () => {
		window.print()
	};

	return (
		<ErrorBoundary
			fallback={(_) => (
				<div role="alert" class="alert alert-error text-lg">
					<p><strong>404</strong> - Formulario invalido</p>
				</div>
			)}
		>
			<div class="grid grid-cols-1 gap-4">
				<div role="alert" class="alert text-lg" classList={{
					'alert-success': isSuccess(),
					'alert-error': !isSuccess(),
				}}>
					<p>{isSuccess() ? hasPayment() ? 'Registro y pago exitosos' : 'Registro exitoso' : 'Error en el pago'}!</p>
				</div>

				<div role="alert" class="alert alert-info alert-soft block">
					<Show when={hasPayment()}>
						<p><strong>Pago:</strong> {formResponse()?.payment_id}</p>
					</Show>
					<p><strong>Formulario:</strong> {searchParams.form_id}</p>
					<p><strong>Correo:</strong> {formResponse()?.email}</p>
				</div>

				<Show when={hasPayment()}>
					<p>Hola {formResponse()?.first_name}, tu inscripción fue correctamente completada.</p>
					<p>Por favor descarga tu comprobante y muéstralo en el curso, te esperamos!</p>

					<button onclick={handleScreenshot} class="btn btn-info w-full">Descarga tu comprobante</button>
				</Show>

				<Show when={!isSuccess()}>
					<p>Error a la hora de realizar el pago por favor intentalo de nuevo</p>

					<A href="/" class="btn btn-info w-full">Regresar al formulario</A>
				</Show>
			</div>
		</ErrorBoundary>
	);
};

export default Result;
