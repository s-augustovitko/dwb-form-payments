import { Component, createResource, Show } from "solid-js";
import { notificationStore, PageLayout } from "../../components";
import { getFormSubmission } from "../form/requests";
import { A, useParams } from "@solidjs/router";
import { OrderStatus, OrderStatusMap } from "../../utils";
import { domToPng } from "modern-screenshot";
import dayjs from "dayjs";

const Result: Component = () => {
	const params = useParams<{ submission_id: string }>()
	const [submissionData] = createResource(() => getFormSubmission(params.submission_id));

	const id = () => `form-id-${params.submission_id}`
	const isSuccess = () => submissionData()?.order.status === OrderStatus.CONFIRMED ||
		submissionData()?.order.status === OrderStatus.ON_SITE
	const hasPayment = () => submissionData()?.order.status === OrderStatus.CONFIRMED

	const handleScreenshot = async () => {
		try {
			const body = document.querySelector(`#${id()}`)
			if (!body) {
				throw new Error("No existe el elemento en la pagina")
			}

			await domToPng(body).then((dataUrl) => {
				const link = document.createElement("a")
				link.download = `comprobante_DWB_${dayjs().format('MMM_YYYY').toUpperCase()
					}.png`
				link.href = dataUrl
				link.click()
			})
		} catch {
			notificationStore.error("No se pudo generar el comprobante, por favor tome una captura")
		}
	};

	return (
		<PageLayout
			title={
				isSuccess() ?
					hasPayment() ?
						'¡Registro y pago exitosos!' :
						'¡Registro exitoso!' :
					'Error en el pago'
			}
			description="Por favor descargue su comprobante y muestrelo en el curso"
			id={id()}
		>
			<div class="grid grid-cols-1 text-center gap-4 bg-base-200">
				<div class="badge w-full" classList={{
					"badge-error": !isSuccess(),
					"badge-success": submissionData()?.order.status === OrderStatus.CONFIRMED,
					"badge-info": submissionData()?.order.status === OrderStatus.ON_SITE,
				}}>
					{OrderStatusMap[submissionData()?.order.status || OrderStatus.DRAFT]}
				</div>
				<div role="alert" class="alert alert-outline alert-info block p-4" classList={{
					"alert-error": !isSuccess(),
					"alert-info": isSuccess()
				}}>
					<p><strong>Nombre:</strong> {
						`${submissionData()?.submission.first_name} ${submissionData()?.submission.last_name}`
					}</p>
					<p><strong>Orden:</strong> {submissionData()?.order.id}</p>
					<p><strong>Respuesta:</strong> {submissionData()?.submission.id}</p>
					<p><strong>Correo:</strong> {submissionData()?.submission.email}</p>
				</div>


				<Show when={isSuccess()}>
					<p>
						Hola {submissionData()?.submission.first_name},<br />
						tu inscripción fue correctamente completada<br />
						Por favor descarga tu comprobante y muéstralo en el curso
					</p>
					<p><strong>¡Te esperamos!</strong></p>

					<button
						onclick={handleScreenshot}
						class="btn btn-primary btn-lg w-full"
					>
						Descarga tu comprobante
					</button>
					<A href="/" class="btn btn-outline w-full">Regresar al formulario</A>
				</Show>

				<Show when={!isSuccess()}>
					<p>Error a la hora de realizar el pago por favor intentelo de nuevo.</p>
					<A href="/" class="btn btn-primary w-full">Regresar al formulario</A>
				</Show>

			</div>
		</PageLayout>
	)
}

export default Result;
