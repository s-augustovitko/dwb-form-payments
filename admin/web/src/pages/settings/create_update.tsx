import { createForm, getValue, getValues, insert, remove, reset, setValues, SubmitHandler, valiForm } from "@modular-forms/solid";
import { A, useNavigate, useParams } from "@solidjs/router";
import { Component, createResource, createSignal, For } from "solid-js";
import { settingSchema, SettingSchema, settingTypes } from "./schema";
import { getDateForDatePicker, getDateForDateTimePicker, getDateTimeForBackEnd, Method, request } from "../../utils";
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
	const isUpdate = () => params.id.toLowerCase() !== "create";

	const [] = createResource(
		() => params.id,
		async (id) => {
			if (id === "create") return null;

			setLoading(true);
			try {
				const res = await getSettingsByID(id);

				reset(settingForm, {
					initialValues: {
						...res,
						start_date: getDateForDatePicker(res.start_date),
						end_date: getDateForDatePicker(res.end_date),
						meal_price_pen: res.meal_price_pen?.toString(),
						meal_price_usd: res.meal_price_usd?.toString(),
						session_price_pen: res.session_price_pen?.toString(),
						session_price_usd: res.session_price_usd?.toString(),
					}
				});
				setValues(settingForm, 'meals', res.meals || [])
				setValues(settingForm, 'sessions',
					res.sessions.map(s => ({
						...s,
						session_time: getDateForDateTimePicker(s.session_time)
					})) || [],
				)

				return res
			} catch (err) {
				notificationStore.error((err as any).message)
				throw err
			} finally {
				setLoading(false)
			}
		}
	);

	const [settingForm, { Form, Field, FieldArray }] = createForm<SettingSchema>({
		validate: valiForm(settingSchema),
		initialValues: {
			form_type: "TALK",
			sessions: [],
			meals: [],
		},
		validateOn: 'blur',
	});

	const handleSubmit: SubmitHandler<SettingSchema> = async (values, _) => {
		setLoading(true);
		const settingsId = params.id;

		try {
			const baseData = {
				form_type: values.form_type,
				title: values.title,
				description: values.description,
				session_price_pen: Number(values.session_price_pen),
				session_price_usd: Number(values.session_price_usd),
				meal_price_pen: Number(values.meal_price_pen),
				meal_price_usd: Number(values.meal_price_usd),
				start_date: getDateTimeForBackEnd(dayjs(values.start_date).startOf("d")),
				end_date: getDateTimeForBackEnd(dayjs(values.end_date).endOf("d")),
			};

			if (isUpdate()) {
				await request(`settings/${settingsId}`, Method.PUT, undefined, baseData);

				const sessionPromises = values.sessions.map(s => {
					const data = { ...s, session_time: getDateTimeForBackEnd(s.session_time) };
					return s.id
						? request(`sessions/${settingsId}/${s.id}`, Method.PUT, undefined, data)
						: request(`sessions/${settingsId}`, Method.POST, undefined, data);
				}) || [];

				const mealPromises = values.meals?.map(m => {
					return m.id
						? request(`meals/${settingsId}/${m.id}`, Method.PUT, undefined, m)
						: request(`meals/${settingsId}`, Method.POST, undefined, m);
				}) || [];

				await Promise.all([...sessionPromises, ...mealPromises]);
			} else {
				const createData = {
					...baseData,
					sessions: values.sessions.map(item => ({ ...item, session_time: getDateTimeForBackEnd(item.session_time) })),
					meals: values.meals || [],
				}
				await request("settings", Method.POST, undefined, createData);
			}

			notificationStore.info("Configuration saved successfully");
			navigate("/settings");
		} catch (err) {
			notificationStore.error((err as any).message);
		} finally {
			setLoading(false);
		}
	};

	function addSession() {
		const startDate = getValue(settingForm, 'start_date')
		console.log(startDate)

		insert(settingForm, 'sessions', {
			value: {
				title: "",
				session_time: getDateForDateTimePicker(!!startDate ? dayjs(startDate).set("h", 10) : dayjs().startOf('hour'))
			}
		})
	}

	async function removeSession(idx: number) {
		let currentSession: { id?: string, title: string, session_time: string } = { title: "", session_time: "" };
		try {
			currentSession = (getValues(settingForm, 'sessions') || []).at(idx) as any || currentSession;
			remove(settingForm, 'sessions', { at: idx })

			if (currentSession.id) {
				await request(`sessions/${params.id}/${currentSession.id}`, Method.DELETE)
			}
		} catch (err) {
			insert(settingForm, 'sessions', {
				at: idx,
				value: currentSession
			})

			notificationStore.error((err as any).message)
		}
	}

	function addMeal() {
		insert(settingForm, 'meals', {
			value: {
				title: "",
			}
		})
	}

	async function removeMeal(idx: number) {
		let currentMeal: { id?: string, title: string } = { title: "" };
		try {
			currentMeal = (getValues(settingForm, 'meals') || []).at(idx) as any || currentMeal;
			remove(settingForm, 'meals', { at: idx })

			if (currentMeal.id) {
				await request(`meals/${params.id}/${currentMeal.id}`, Method.DELETE)
			}
		} catch (err) {
			insert(settingForm, 'meals', {
				at: idx,
				value: currentMeal
			})

			notificationStore.error((err as any).message)
		}
	}

	return (
		<Form onSubmit={handleSubmit}>
			<div class="inline-flex gap-4 items-center mb-2">
				<A href="/settings" class="btn btn-ghost btn-circle text-lg text-primary">
					<FaSolidChevronLeft />
				</A>
				<h2 class="text-lg font-bold">{isUpdate() ? "Update" : "Create"} Config</h2>
			</div>

			<Field name="form_type">
				{(field, props) => (
					<Select
						{...props}
						value={field.value}
						error={field.error}
						required
						disabled={loading() || isUpdate()}
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
				<Field name="session_price_pen">
					{(field, props) => (
						<Input
							{...props}
							value={field.value ?? 0}
							error={field.error}
							required
							label="Session Price (PEN)"
							disabled={loading()}
							inputmode="decimal"
							step="0.01"
							type="number"
						/>
					)}
				</Field>

				<Field name="session_price_usd">
					{(field, props) => (
						<Input
							{...props}
							value={field.value ?? 0}
							error={field.error}
							required
							label="Session Price (USD)"
							disabled={loading()}
							inputmode="decimal"
							step="0.01"
							type="number"
						/>
					)}
				</Field>
			</div>

			<FieldArray name="sessions">
				{(fieldArray) => (
					<div>
						<div class="join join-vertical w-full mb-4">
							<For each={fieldArray.items}>
								{(_, index) => (
									<div class="inline-flex gap-4 p-4 border border-base-300 join-item">
										<Field name={`sessions.${index()}.id`}>
											{() => (
												<div class="hidden"></div>
											)}
										</Field>

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

						{fieldArray.error && <div class="text-xs text-error mb-2 text-center">{fieldArray.error}</div>}
					</div>
				)}
			</FieldArray>

			<button
				type="button"
				class="w-full btn btn-info"
				disabled={loading()}
				onclick={addSession}
			>
				<FaSolidAdd /> Add Session
			</button>

			<legend class="fieldset-legend mt-4">Meals</legend>

			<div class="grid grid-cols-2 gap-4 mb-4">
				<Field name="meal_price_pen">
					{(field, props) => (
						<Input
							{...props}
							value={field.value ?? 0}
							error={field.error}
							required
							label="Meal Price (PEN)"
							disabled={loading()}
							inputmode="decimal"
							step="0.01"
							type="number"
						/>
					)}
				</Field>

				<Field name="meal_price_usd">
					{(field, props) => (
						<Input
							{...props}
							value={field.value ?? 0}
							error={field.error}
							required
							label="Meal Price (USD)"
							disabled={loading()}
							inputmode="decimal"
							step="0.01"
							type="number"
						/>
					)}
				</Field>
			</div>

			<FieldArray name="meals">
				{(fieldArray) => (
					<div>
						<div class="join join-vertical w-full mb-4">
							<For each={fieldArray.items}>
								{(_, index) => (
									<div class="inline-flex gap-4 p-4 border border-base-300 join-item">
										<Field name={`meals.${index()}.id`}>
											{() => (
												<div class="hidden"></div>
											)}
										</Field>

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

						{fieldArray.error && <div class="text-xs text-error mb-2 text-center">{fieldArray.error}</div>}
					</div>
				)}
			</FieldArray>

			<button
				type="button"
				class="w-full btn btn-info"
				disabled={loading()}
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
