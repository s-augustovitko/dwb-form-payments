import { Component, createResource, createSignal, ErrorBoundary, Suspense } from "solid-js";
import { createForm, getDateForDatePicker, getDateTimeForBackEnd, Method, notBeforeDate, request } from "../../utils";
import { Input, Loading, notificationStore, Select, TextArea } from "../../components";
import { settingsTypes, settingsUpdateSchema, SettingsValues } from "./schema";
import { FaSolidChevronLeft } from "solid-icons/fa";
import { A, useNavigate, useParams } from "@solidjs/router";
import dayjs from "dayjs";

async function getSettingsByID(settingsId: string): Promise<SettingsValues> {
	return request<SettingsValues>(
		"settings/" + settingsId,
		Method.GET,
	)
}

const UpdateSettings: Component = () => {
	const [loading, setLoading] = createSignal<boolean>(false);
	const [settingsForm, setSettingsForm] = createSignal(
		createForm(settingsUpdateSchema({})),
	);

	const navigate = useNavigate();
	const params = useParams<{ id: string }>();
	const [settingsData] = createResource(
		() => params.id,
		async (val) => {
			const res = await getSettingsByID(val)
			setSettingsForm(
				createForm(settingsUpdateSchema({
					form_type: res.form_type,
					title: res.title,
					description: res.description,
					start_date: getDateForDatePicker(res.start_date),
					end_date: getDateForDatePicker(res.end_date),
					meal_price_pen: res.meal_price_pen,
					meal_price_usd: res.meal_price_usd,
					session_price_pen: res.session_price_pen,
					session_price_usd: res.session_price_usd,
				}))
			)

			return res
		}
	)

	// Submit handler
	const submit = async (e: Event) => {
		e.preventDefault();
		if (!settingsForm().validate()) {
			return;
		}

		setLoading(true);
		try {
			const values = settingsForm().values();
			const data = {
				title: values.title.trim(),
				description: values.description.trim(),
				session_price_pen: Number.parseFloat(values.session_price_pen as any),
				session_price_usd: Number.parseFloat(values.session_price_usd as any),
				meal_price_pen: Number.parseFloat(values.meal_price_pen as any),
				meal_price_usd: Number.parseFloat(values.meal_price_usd as any),
				start_date: getDateTimeForBackEnd(dayjs(values.start_date).startOf("d")),
				end_date: getDateTimeForBackEnd(dayjs(values.end_date).endOf("d")),
			}

			await request(`settings/${params.id}`, Method.PUT, undefined, data)
			navigate("/settings");
		} catch (err) {
			notificationStore.error((err as any).message)
		} finally {
			setLoading(false)
		}
	};

	return (
		<ErrorBoundary
			fallback={(_) => (
				<div class="inline-flex gap-4 items-center mb-2">
					<A href="/settings" class="btn btn-ghost btn-circle text-lg text-primary">
						<FaSolidChevronLeft />
					</A>
					<h2 class="text-lg font-bold">404 - Settings not found</h2>
				</div>
			)}
		>
			<Suspense fallback={<Loading />}>
				<form onSubmit={submit}>
					<div class="inline-flex gap-4 items-center mb-2">
						<A href="/settings" class="btn btn-ghost btn-circle text-lg text-primary">
							<FaSolidChevronLeft />
						</A>
						<h2 class="text-lg font-bold">Update Config: {settingsData()?.title}</h2>
					</div>

					{/* Basic fields */}
					<Select
						items={settingsTypes}
						title="Form Type *"
						field={settingsForm().fields.form_type}
						disabled={() => true}
					/>
					<Input title="Title *" field={settingsForm().fields.title} />
					<TextArea title="Description" field={settingsForm().fields.description} />

					<Input type="date" title="Start Date *" field={settingsForm().fields.start_date} />
					<Input type="date" title="End Date *" field={settingsForm().fields.end_date} validate={() => notBeforeDate(settingsForm().fields.start_date.get())} />

					<legend class="fieldset-legend mt-4">Sessions</legend>

					<div class="grid grid-cols-2 gap-4 mb-4">
						<Input type="number" title="Session Price (PEN) *" field={settingsForm().fields.session_price_pen} />
						<Input type="number" title="Session Price (USD) *" field={settingsForm().fields.session_price_usd} />
					</div>

					<legend class="fieldset-legend mt-4">Meals</legend>

					<div class="grid grid-cols-2 gap-4 mb-4">
						<Input type="number" title="Meal Price (PEN) *" field={settingsForm().fields.meal_price_pen} />
						<Input type="number" title="Meal Price (USD) *" field={settingsForm().fields.meal_price_usd} />
					</div>

					<button
						type="submit"
						class="w-full btn btn-primary mt-4"
						disabled={loading()}
					>
						{loading() ? "Saving..." : "Save Configuration"}
					</button>
				</form>
			</Suspense>
		</ErrorBoundary>
	);
};

export default UpdateSettings;
