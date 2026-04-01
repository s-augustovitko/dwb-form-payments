import { createForm, getValue, insert, remove, SubmitHandler, valiForm } from "@modular-forms/solid";
import { A, useNavigate, useParams } from "@solidjs/router";
import { Component, createResource, createSignal, For } from "solid-js";
import { settingSchema, SettingSchema, settingTypes } from "./schema";
import { getDateForDateTimePicker, getDateTimeForBackEnd, Method, request } from "../../utils";
import dayjs from "dayjs";
import { Input, notificationStore, Select } from "../../components";
import { FaSolidAdd, FaSolidChevronLeft, FaSolidTrash } from "solid-icons/fa";

async function getSettingsByID(settingsId: string): Promise<SettingSchema> {
	return request<SettingSchema>(
		"settings/" + settingsId,
		Method.GET,
	)
}

const CreateSettings: Component = () => {
	const [loading, setLoading] = createSignal<boolean>(false);
	const navigate = useNavigate();

	const params = useParams<{ id: string }>();
	const [settingData] = createResource(
		() => params.id,
		async (val) => {
			if (val?.toLowerCase() === "create") {
				return
			}
			const res = await getSettingsByID(val)
		}
	)

	const [settingForm, { Form, Field, FieldArray }] = createForm<SettingSchema>({
		validate: valiForm(settingSchema),
		initialValues: {
			form_type: "TALK",
			sessions: [],
			meals: [],
		},
		validateOn: 'input',
	});

	const handleSubmit: SubmitHandler<SettingSchema> = async (values, _) => {
		setLoading(true)
		try {
			const data = {
				...values,
				session_price_pen: Number.parseFloat(values.session_price_pen as any),
				session_price_usd: Number.parseFloat(values.session_price_usd as any),
				meal_price_pen: Number.parseFloat(values.meal_price_pen as any),
				meal_price_usd: Number.parseFloat(values.meal_price_usd as any),
				start_date: getDateTimeForBackEnd(dayjs(values.start_date).startOf("d")),
				end_date: getDateTimeForBackEnd(dayjs(values.end_date).endOf("d")),
				sessions: values.sessions.map(item => ({ ...item, session_time: getDateTimeForBackEnd(item.session_time) }))
			}

			await request("settings", Method.POST, undefined, data)
			navigate("/settings");
		} catch (err) {
			notificationStore.error((err as any).message)
		} finally {
			setLoading(false)
		}
	};

	function addSession() {
		insert(settingForm, 'sessions', {
			value: {
				title: "",
				session_time: getValue(settingForm, 'start_date') || getDateForDateTimePicker()
			}
		})
	}

	function removeSession(idx: number) {
		remove(settingForm, 'sessions', { at: idx })
	}

	function addMeal() {
		insert(settingForm, 'meals', {
			value: {
				title: "",
			}
		})
	}

	function removeMeal(idx: number) {
		remove(settingForm, 'meals', { at: idx })
	}

	return (
		<Form onSubmit={handleSubmit}>
			<div class="inline-flex gap-4 items-center mb-2">
				<A href="/settings" class="btn btn-ghost btn-circle text-lg text-primary">
					<FaSolidChevronLeft />
				</A>
				<h2 class="text-lg font-bold">Create Config</h2>
			</div>

			<Field name="form_type">
				{(field, props) => (
					<Select
						{...props}
						value={field.value}
						error={field.error}
						required
						disabled={loading()}
						items={settingTypes}
						label="Form Type"
					/>
				)}
			</Field>

			<Field name="title">
				{(field, props) => (
					<Input
						{...props}
						value={field.value}
						error={field.error}
						required
						label="Title"
						disabled={loading()}
					/>
				)}
			</Field>

			<Field name="description">
				{(field, props) => (
					<Input
						{...props}
						value={field.value}
						error={field.error}
						label="Description"
						disabled={loading()}
					/>
				)}
			</Field>

			<Field name="start_date">
				{(field, props) => (
					<Input
						{...props}
						value={field.value}
						error={field.error}
						label="Start Date"
						required
						disabled={loading()}
						type="date"
					/>
				)}
			</Field>

			<Field name="end_date">
				{(field, props) => (
					<Input
						{...props}
						value={field.value}
						error={field.error}
						label="End Date"
						required
						disabled={loading()}
						type="date"
					/>
				)}
			</Field>

			<legend class="fieldset-legend mt-4">Sessions</legend>

			<div class="grid grid-cols-2 gap-4 mb-4">
				<Field name="session_price_pen" type="number">
					{(field, props) => (
						<Input
							{...props}
							value={field.value ?? 0}
							error={field.error}
							required
							label="Session Price (PEN)"
							disabled={loading()}
							inputmode="decimal"
							type="number"
						/>
					)}
				</Field>

				<Field name="session_price_usd" type="number">
					{(field, props) => (
						<Input
							{...props}
							value={field.value ?? 0}
							error={field.error}
							required
							label="Session Price (USD)"
							disabled={loading()}
							inputmode="decimal"
							type="number"
						/>
					)}
				</Field>
			</div>

			<FieldArray name="sessions">
				{(fieldArray) => (
					<div class="join join-vertical w-full mb-4">
						<For each={fieldArray.items}>
							{(_, index) => (
								<div class="inline-flex gap-4 p-4 border border-base-300 join-item">
									<Field name={`sessions.${index()}.title`}>
										{(field, props) => (
											<Input
												{...props}
												value={field.value}
												error={field.error}
												required
												label="Title"
												disabled={loading()}
											/>
										)}
									</Field>

									<Field name={`sessions.${index()}.session_time`}>
										{(field, props) => (
											<Input
												{...props}
												value={field.value}
												error={field.error}
												label="Session Time"
												required
												disabled={loading()}
												type="datetime-local"
											/>
										)}
									</Field>

									<div class="w-min">
										<label class="text-xs label mb-1">Delete</label>

										<button
											type="button"
											onclick={() => removeSession(index())}
											class="btn btn-ghost btn-error btn-circle"
										>
											<FaSolidTrash />
										</button>
									</div>
								</div>
							)}
						</For>
					</div>
				)}
			</FieldArray>

			<button
				type="button"
				class="w-full btn btn-info"
				onclick={addSession}
			>
				<FaSolidAdd /> Add Session
			</button>

			<legend class="fieldset-legend mt-4">Meals</legend>

			<div class="grid grid-cols-2 gap-4 mb-4">
				<Field name="meal_price_pen" type="number">
					{(field, props) => (
						<Input
							{...props}
							value={field.value ?? 0}
							error={field.error}
							required
							label="Meal Price (PEN)"
							disabled={loading()}
							inputmode="decimal"
							type="number"
						/>
					)}
				</Field>

				<Field name="meal_price_usd" type="number">
					{(field, props) => (
						<Input
							{...props}
							value={field.value ?? 0}
							error={field.error}
							required
							label="Meal Price (USD)"
							disabled={loading()}
							inputmode="decimal"
							type="number"
						/>
					)}
				</Field>
			</div>

			<FieldArray name="meals">
				{(fieldArray) => (
					<div class="join join-vertical w-full mb-4">
						<For each={fieldArray.items}>
							{(_, index) => (
								<div class="inline-flex gap-4 p-4 border border-base-300 join-item">
									<Field name={`meals.${index()}.title`}>
										{(field, props) => (
											<Input
												{...props}
												value={field.value}
												error={field.error}
												required
												label="Title"
												disabled={loading()}
											/>
										)}
									</Field>

									<div class="w-min">
										<label class="text-xs label mb-1">Delete</label>

										<button
											type="button"
											onclick={() => removeMeal(index())}
											class="btn btn-ghost btn-error btn-circle"
										>
											<FaSolidTrash />
										</button>
									</div>
								</div>
							)}
						</For>
					</div>
				)}
			</FieldArray>

			<button
				type="button"
				class="w-full btn btn-info"
				onclick={() => addMeal()}
			>
				<FaSolidAdd /> Add Meal
			</button>

			<button
				type="submit"
				class="w-full btn btn-primary mt-4"
				disabled={loading()}
			>
				{loading() ? "Saving..." : "Save Configuration"}
			</button>
		</Form>
	);
};

export default CreateSettings;
