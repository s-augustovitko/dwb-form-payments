import { useSearchParams } from "@solidjs/router";
import { Show, type Component } from "solid-js";

const Form: Component = () => {
	const [searchParams, _] = useSearchParams<{
		full_name?: string,
		email?: string,
		payment_id?: string,
		payment_status?: string,
		form_id?: string
	}>();

	const handleScreenshot = async () => {
		window.print()
	};

	return (
		<div class="grid grid-cols-1 gap-4">
			<div role="alert" class="alert alert-success text-lg">
				<p>Registro {searchParams.payment_status !== 'SUCCESS' ? 'exitoso' : 'y pago exitosos'}!</p>
			</div>

			<div role="alert" class="alert alert-info alert-soft block">
				<Show when={!!searchParams.payment_id}>
					<p><strong>Pago:</strong> {searchParams.payment_id}</p>
				</Show>
				<p><strong>Formulario:</strong> {searchParams.form_id}</p>
				<p><strong>Correo:</strong> {searchParams.email}</p>
			</div>


			<p>Hola {searchParams.full_name}, tu inscripcion fue correctamente completada.</p>

			<p>Por favor descarga tu comprobante y muestralo en el curso, te esperamos!</p>

			<button onclick={handleScreenshot} class="btn btn-info">Descarga tu comprobante</button>
		</div >
	);
};

export default Form;
