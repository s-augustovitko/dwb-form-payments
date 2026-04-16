import { Component, createResource, createSignal, For, Show } from "solid-js";
import { notificationStore, PageLayout } from "../../components";
import { A, useNavigate, useParams } from "@solidjs/router";
import { getFormSubmission } from "../form/requests";
import { AddonType, Currency, getDateList, getMoneyDisplay, PUBLIC_KEY, RETURN_URL, RSA_PUB_ID, RSA_PUB_VAL } from "../../utils";
import { updatePayment } from "./request";
import { PaymentType } from "./types";

const Checkout: Component = () => {
	const [loading, setLoading] = createSignal<boolean>(false)

	const navigate = useNavigate();
	const params = useParams<{ submission_id: string }>()
	const [submissionData] = createResource(() => getFormSubmission(params.submission_id));

	const getSessionList = () => submissionData()?.order_items
		.filter(item => item.addon_type === AddonType.SESSION)

	const getMealList = () => submissionData()?.order_items
		.filter(item => item.addon_type === AddonType.MEAL)

	const getDiscountList = () => submissionData()?.order_items
		.filter(item =>
			item.addon_type === AddonType.ALL_SESSIONS_DISCOUNT ||
			item.addon_type === AddonType.EARLY_DISCOUNT
		)

	const getEarlyDiscount = () => submissionData()?.order_items
		.find(item => item.addon_type === AddonType.EARLY_DISCOUNT)

	const getOnSitePrice = () =>
		Number(submissionData()?.order.amount) + Number(getEarlyDiscount()?.price || 0)

	const getSubtotal = () => {
		return Number(submissionData()?.order.amount) +
			(getDiscountList()?.
				reduce((acc, item) => acc + Number(item.price || 0), 0) ||
				0)
	}

	const getWebPrice = () => Number(submissionData()?.order.amount)


	const handleCulqiAction = async () => {
		setLoading(true)
		try {
			await (window as any).Culqi?.close()

			const token = (window as any).Culqi?.token?.id;
			const error = (window as any).Culqi?.error;
			if (!!error) {
				throw new Error(error.user_message || "No se pudo procesar el pago")
			}
			if (!token) {
				notificationStore.error("El pago fue cancelado o no generó token")
				return
			}

			await updatePayment({
				payment_type: PaymentType.CULQI,
				culqi_token: token,
				submission_id: params.submission_id
			})
			navigate("/result/" + params.submission_id)
			return
		} catch (err) {
			notificationStore.error((err as any).message || "No se pudo procesar el pago");
		} finally {
			setLoading(false)
		}
	}

	const openCulqi = async () => {
		const data = submissionData()
		const settings = {
			title: `${data?.submission.first_name || ""
				} ${submissionData()?.submission.last_name || ""
				} Curso`,
			currency: data?.order.currency || Currency.PEN,
			amount: getWebPrice() * 100,
			xculqirsaid: RSA_PUB_ID,
			rsapublickey: RSA_PUB_VAL,
		}
		const client = {
			email: data?.submission.email,
		}
		const config = {
			settings,
			client,
		};

		(window as any).Culqi3DS.publicKey = PUBLIC_KEY;
		(window as any).Culqi3DS.settings = {
			charge: {
				totalAmount: getWebPrice() * 100,
				currency: data?.order.currency || Currency.PEN,
				returnUrl: RETURN_URL,
			},
			card: client,
		};

		(window as any).Culqi = new (window as any).CulqiCheckout(PUBLIC_KEY, config);
		(window as any).Culqi.culqi = handleCulqiAction;

		await ((window as any).Culqi.open() as Promise<any>)
	}

	const checkout = async (typ: PaymentType) => {
		setLoading(true)
		try {
			if (typ === PaymentType.CULQI) {
				await openCulqi()
			} else {
				await updatePayment({
					payment_type: PaymentType.ON_SITE,
					submission_id: params.submission_id
				})

				navigate("/result/" + params.submission_id)
			}
		} catch (err) {
			notificationStore.error(`No se pudo procesar el formulario: ${(err as any).message} `)
		} finally {
			setLoading(false)
		}
	};

	return (
		<PageLayout
			title="Resumen"
			actions={
				<A class="btn btn-circle btn-ghost text-xl" href={`/?submission_id=${params.submission_id}`}>
					&#129168;
				</A>
			}
		>
			<div class="grid grid-cols-1 gap-4">
				<div role="alert" class="alert alert-info block">
					<p><strong>Nombre:</strong> {submissionData()?.submission.first_name + " " + submissionData()?.submission.last_name}</p>
					<p><strong>Correo:</strong> {submissionData()?.submission.email}</p>
					<p><strong>Telefono:</strong> {`(${submissionData()?.submission.country_code}) ${submissionData()?.submission.phone} `}</p>
				</div>

				<Show when={(getSessionList()?.length || 0) > 0}>
					<div class="bg-base-100 border-base-300 collapse shadow">
						<input type="checkbox" class="peer" />
						<div
							class="collapse-title peer-checked:bg-base-200"
						>
							Sesiones ({getSessionList()?.length})
						</div>
						<ul
							class="collapse-content list"
						>
							<For each={getSessionList()}>
								{(item) => (
									<li class="list-row">
										<div class="list-col-grow">
											<div>{item.title}</div>
											<div class="text-sm text-base-content/50">{getDateList(item.date_time)}</div>
										</div>
										<div class="text-sm font-bold">{getMoneyDisplay(item.currency, Number(item.price))}</div>
									</li>
								)}
							</For>
						</ul>
					</div>
				</Show>

				<Show when={(getMealList()?.length || 0) > 0}>
					<div class="bg-base-100 border-base-300 collapse shadow">
						<input type="checkbox" class="peer" />
						<div
							class="collapse-title peer-checked:bg-base-200"
						>
							Comidas ({getMealList()?.length})
						</div>
						<ul
							class="collapse-content list"
						>
							<For each={getMealList()}>
								{(item) => (
									<li class="list-row">
										<div class="list-col-grow">{item.title}</div>
										<div class="text-sm font-bold">{getMoneyDisplay(item.currency, Number(item.price))}</div>
									</li>
								)}
							</For>
						</ul>
					</div>
				</Show>


				<div class="grid w-full gap-4 my-4">
					<h2 class="text-lg font-bold">Total</h2>

					<div class="overflow-x-scroll bg-base-100 rounded-box shadow-md">
						<table class="table">
							<thead>
								<tr class="text-xs">
									<th>Subtotal</th>
									<th>{getMoneyDisplay(submissionData()?.order.currency, getSubtotal())}</th>
								</tr>

								<For each={getDiscountList()}>
									{(item) => (
										<tr class="text-xs">
											<td>{item.title} {item.addon_type === AddonType.EARLY_DISCOUNT ? "(Solo en Web)" : ""}</td>
											<td class="text-success">- {getMoneyDisplay(submissionData()?.order.currency, Number(item.price))}</td>
										</tr>
									)}
								</For>

								<Show when={getEarlyDiscount()}>
									<tr>
										<th>Total Pago Web</th>
										<th>{getMoneyDisplay(submissionData()?.order.currency, getWebPrice())}</th>
									</tr>
									<tr>
										<th>Total Pago en Evento</th>
										<th>{getMoneyDisplay(submissionData()?.order.currency, getOnSitePrice())}</th>
									</tr>
								</Show>

								<Show when={!getEarlyDiscount()}>
									<tr>
										<th>Total</th>
										<th>{getMoneyDisplay(submissionData()?.order.currency, getOnSitePrice())}</th>
									</tr>
								</Show>
							</thead>
						</table>
					</div>
				</div>

				<button
					class="btn btn-primary btn-lg"
					onclick={() => checkout(PaymentType.CULQI)}
					disabled={loading()}
				>
					Pagar Ahora {getMoneyDisplay(submissionData()?.order.currency, getWebPrice())}
				</button>

				<button
					class="btn btn-outline"
					onclick={() => checkout(PaymentType.ON_SITE)}
					disabled={loading()}
				>
					Pagar en Evento {getMoneyDisplay(submissionData()?.order.currency, getOnSitePrice())}
				</button>
			</div>
		</PageLayout>
	)
}

export default Checkout;
