import { Accessor, Component, createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { A, useNavigate, useParams } from "@solidjs/router";
import { Card, Input, notificationStore, PageLayout, Select, SelectInput, TextArea } from "../../components";
import { createForm, getValue, getValues, insert, move, remove, reset, setValues, SubmitHandler, validate, valiForm } from "@modular-forms/solid";
import { AddonResponse, CreateFormWithAddonsRequest, formTypes, PopulatedFormResponse, UpdateFormRequest, UpsertAddonRequest } from "./types";
import { AddonType, Currency, currencyListItems, FormType, getDateForDatePicker, getDateForDateTimePicker, getDateTimeForBackEnd, Method, request } from "../../utils";
import { FiCalendar, FiChevronDown, FiChevronUp, FiCopy, FiDollarSign, FiX } from "solid-icons/fi";
import { FaSolidKiwiBird, FaSolidUtensils } from "solid-icons/fa";
import dayjs from "dayjs";
import { formSchema, FormWithAddonsData } from "./schemas";

async function getFormById(formId: string) {
	return request<PopulatedFormResponse>(
		`forms/${formId}`,
		Method.GET,
	)
}

function getAddonDataFromRes(addons: AddonResponse[], typ: AddonType[]): any[] {
	return addons.filter(addon => typ.includes(addon.addon_type)).map(item => {
		const data: any = {
			id: item.id,
			title: item.title,
			addon_type: item.addon_type,
			price: item.price || 0,
			currency: item.currency || Currency.PEN,
			hint: item.hint,
			date_time: item.date_time ? getDateForDateTimePicker(item.date_time) : undefined
		}

		return data
	})
}

function getAddonField(typ: AddonType): 'sessions' | 'meals' | 'discounts' {
	switch (typ) {
		case AddonType.SESSION:
			return 'sessions'
		case AddonType.MEAL:
			return 'meals'
		case AddonType.ALL_SESSIONS_DISCOUNT:
		case AddonType.EARLY_DISCOUNT:
			return 'discounts'
	}
}

function transformDataForBackendCreate(data: FormWithAddonsData): CreateFormWithAddonsRequest {
	const out: CreateFormWithAddonsRequest = {
		form_type: data.form_type,
		title: data.title,
		description: data.description,
		start_date: getDateTimeForBackEnd(dayjs(data.start_date).startOf('d')),
		end_date: getDateTimeForBackEnd(dayjs(data.end_date).endOf('d')),
		addons: [
			...data.sessions.map((item, idx) => ({
				...item,
				addon_type: item.addon_type || AddonType.SESSION,
				sort_order: idx,
				date_time: getDateTimeForBackEnd(item.date_time)
			})),

			...(data.meals || []).map((item, idx) => ({
				...item,
				addon_type: item.addon_type || AddonType.MEAL,
				sort_order: idx + data.sessions.length
			})),

			...(data.discounts || []).map((item, idx) => ({
				...item,
				addon_type: item.addon_type || AddonType.ALL_SESSIONS_DISCOUNT,
				sort_order: idx + data.sessions.length + (data.meals?.length || 0),
				date_time: item.date_time ? getDateTimeForBackEnd(item.date_time) : undefined,
			})),
		]
	}

	return out
}

function transformDataForBackendUpdate(data: FormWithAddonsData, formId: string): { addons: UpsertAddonRequest[], form: UpdateFormRequest } {
	const out: { addons: UpsertAddonRequest[], form: UpdateFormRequest } = {
		addons: [
			...data.sessions.map((item, idx) => ({
				...item,
				form_id: formId,
				addon_type: item.addon_type || AddonType.SESSION,
				sort_order: idx,
				date_time: getDateTimeForBackEnd(item.date_time)
			})),

			...(data.meals || []).map((item, idx) => ({
				...item,
				form_id: formId,
				addon_type: item.addon_type || AddonType.MEAL,
				sort_order: idx + data.sessions.length
			})),

			...(data.discounts || []).map((item, idx) => ({
				...item,
				form_id: formId,
				addon_type: item.addon_type || AddonType.ALL_SESSIONS_DISCOUNT,
				sort_order: idx + data.sessions.length + (data.meals?.length || 0),
				date_time: item.date_time ? getDateTimeForBackEnd(item.date_time) : undefined,
			})),
		],
		form: {
			form_type: data.form_type,
			title: data.title,
			description: data.description,
			start_date: getDateTimeForBackEnd(dayjs(data.start_date).startOf('d')),
			end_date: getDateTimeForBackEnd(dayjs(data.end_date).endOf('d')),
		}
	}

	return out
}

const CreateUpdateForm: Component = () => {
	const navigate = useNavigate();

	const [loading, setLoading] = createSignal<boolean>(false);
	const params = useParams<{ id: string }>();
	const isUpdate = () => params.id.toLowerCase() !== "create";

	const [form, { Form, Field, FieldArray }] = createForm<FormWithAddonsData>({
		validate: valiForm(formSchema),
		initialValues: {
			form_type: FormType.CONFERENCE,
			start_date: getDateForDatePicker(),
			end_date: getDateForDatePicker(),
			sessions: [],
			meals: [],
			discounts: [],
		},
		validateOn: 'input',
	});

	const [_res, { refetch }] = createResource(
		() => params.id,
		async (id) => {
			if (id.toLowerCase() === "create") return null;

			setLoading(true);
			try {
				const res = await getFormById(id);
				const data: FormWithAddonsData = {
					form_type: res.form_type,
					title: res.title,
					description: res.description,
					start_date: getDateForDatePicker(res.start_date, 0),
					end_date: getDateForDatePicker(res.end_date, 23),

					sessions: [],
					meals: [],
					discounts: [],
				}

				reset(form, {
					initialValues: data
				});

				setValues(form, 'sessions', getAddonDataFromRes(res.addons, [AddonType.SESSION]))
				setValues(form, 'meals', getAddonDataFromRes(res.addons, [AddonType.MEAL]))
				setValues(form, 'discounts', getAddonDataFromRes(res.addons, [AddonType.ALL_SESSIONS_DISCOUNT, AddonType.EARLY_DISCOUNT]))

				await validate(form)
				return res
			} catch (err) {
				notificationStore.error((err as any).message)
				throw err
			} finally {
				setLoading(false)
			}
		}
	);

	function getDefaultAddonData(typ: AddonType): any {
		let data: any = {
			title: "",
			addon_type: typ,
			price: 0,
			currency: Currency.PEN
		}

		if (typ === AddonType.SESSION || typ === AddonType.EARLY_DISCOUNT) {
			const startDate = getValue(form, 'start_date')
			data.date_time = getDateForDateTimePicker(dayjs(startDate))
		}
		return data
	}

	function addAddon(typ: AddonType, index?: number) {
		let field = getAddonField(typ)
		let data;
		if (Number.isInteger(index)) {
			const val = (getValues(form, field) || []).at(index!)
			if (val) {
				data = { ...val, id: undefined }
			}
		}
		if (!data) {
			data = getDefaultAddonData(typ)
		}

		insert(form, field, {
			value: data
		})
	}

	function moveAddon(typ: AddonType, from: number, to: number) {
		let field = getAddonField(typ)
		move(form, field, { from, to })
	}

	async function removeAddon(typ: AddonType, idx: number) {
		let currentAddon = getDefaultAddonData(typ)
		let field = getAddonField(typ)

		try {
			currentAddon = (getValues(form, field) || []).at(idx) as any || currentAddon;
			remove(form, field, { at: idx })

			if (currentAddon.id) {
				await request(`addons/${currentAddon.id}/active`, Method.PUT, undefined, { active: false })
			}
		} catch (err) {
			insert(form, field, {
				at: idx,
				value: currentAddon
			})

			notificationStore.error((err as any).message)
		}
	}

	const handleSubmit: SubmitHandler<FormWithAddonsData> = async (values, _) => {
		setLoading(true);

		try {
			if (!(await validate(form))) {
				return
			}
			if (isUpdate()) {
				const data = transformDataForBackendUpdate(values, params.id)

				await request(`forms/${params.id}`, Method.PUT, undefined, data.form)

				const results = await Promise.allSettled(
					data.addons.map(item => request("addons", Method.POST, undefined, item)),
				);
				const failures = results.filter(r => r.status === 'rejected');
				if (failures.length > 0) {
					notificationStore.error(`${failures.length} item(s) failed to save:\n ${failures.map(item => item.reason?.message || item.reason).join(",\n ")}`);
					await refetch()
					return;
				}
			} else {
				const data = transformDataForBackendCreate(values)

				await request("forms", Method.POST, undefined, data)
			}

			notificationStore.info("Form saved successfully");
			navigate("/forms");
		} catch (err) {
			notificationStore.error((err as any).message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<Form onSubmit={handleSubmit}>
			<PageLayout
				title={isUpdate() ? "Update Event Form" : "Create New Event Form"}
				actions={
					<>
						<A href="/forms" class="btn">Cancel</A>
						<button type="submit" class="btn btn-primary">Save Form</button>
					</>
				}
			>
				<div class="grid grid-cols-1 gap-6">
					<Card title="Basic Information">
						<Field name="form_type">
							{(field, props) => (
								<Select
									{...props}
									value={field.value}
									error={field.error}
									required
									disabled={loading()}
									items={formTypes}
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
								<TextArea
									{...props}
									value={field.value}
									error={field.error}
									label="Description"
									disabled={loading()}
								/>
							)}
						</Field>
					</Card>

					<Card title="Timeline">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
						</div>
					</Card>

					<Card title="Addons (Sessions)">
						<FieldArray name="sessions">
							{(fieldArray) => (
								<>
									{fieldArray.error && <div class="text-xs text-error mb-2">{fieldArray.error}</div>}

									<For each={fieldArray.items}>
										{(_, index) => (
											<div class="card border-2 border-base-300 hover:border-primary/50 p-4">
												<AddonActions
													typ={AddonType.SESSION}
													moveAddon={moveAddon}
													removeAddon={removeAddon}
													index={index}
													maxIdx={() => fieldArray.items.length}
													addAddon={addAddon}
												/>

												<Field name={`sessions.${index()}.id`}>
													{() => (
														<div class="hidden"></div>
													)}
												</Field>

												<Field name={`sessions.${index()}.addon_type`}>
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

												<Field name={`sessions.${index()}.currency`}>
													{(currencyField, currencyProps) => (
														<Field name={`sessions.${index()}.price`} type="number">
															{(priceField, priceProps) => (
																<SelectInput
																	input={{ ...priceProps, value: priceField.value?.toString(), type: 'number', step: "0.01", inputmode: 'decimal' }}
																	select={{ ...currencyProps, value: currencyField.value }}
																	error={priceField.error || currencyField.error}
																	disabled={loading()}
																	items={currencyListItems}
																	required
																	label="Currency & Price"
																/>
															)}
														</Field>
													)}
												</Field>

												<Field name={`sessions.${index()}.date_time`}>
													{(field, props) => (
														<Input
															{...props}
															value={field.value}
															error={field.error}
															label="Date & Time"
															required
															disabled={loading()}
															type="datetime-local"
														/>
													)}
												</Field>

												<Field name={`sessions.${index()}.hint`}>
													{(field, props) => (
														<Input
															{...props}
															value={field.value}
															error={field.error}
															label="Hint"
															disabled={loading()}
														/>
													)}
												</Field>
											</div>
										)}
									</For>
								</>
							)}
						</FieldArray>

						<button
							type="button"
							class="w-full btn btn-dash btn-primary flex flex-col items-center justify-center gap-2 h-16"
							disabled={loading()}
							onclick={() => addAddon(AddonType.SESSION)}
						>
							<FiCalendar class="size-6" />
							<span>Add Session</span>
						</button>
					</Card>

					<Card title="Addons (Meals)">
						<FieldArray name="meals">
							{(fieldArray) => (
								<>
									{fieldArray.error && <div class="text-xs text-error mb-2">{fieldArray.error}</div>}

									<For each={fieldArray.items}>
										{(_, index) => (
											<div class="card border-2 border-base-300 hover:border-primary/50 p-4">
												<AddonActions
													typ={AddonType.MEAL}
													moveAddon={moveAddon}
													removeAddon={removeAddon}
													index={index}
													maxIdx={() => fieldArray.items.length}
													addAddon={addAddon}
												/>

												<Field name={`meals.${index()}.id`}>
													{() => (
														<div class="hidden"></div>
													)}
												</Field>

												<Field name={`meals.${index()}.addon_type`}>
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

												<Field name={`meals.${index()}.currency`}>
													{(currencyField, currencyProps) => (
														<Field name={`meals.${index()}.price`} type="number">
															{(priceField, priceProps) => (
																<SelectInput
																	input={{ ...priceProps, value: priceField.value?.toString(), type: 'number', step: "0.01", inputmode: 'decimal' }}
																	select={{ ...currencyProps, value: currencyField.value }}
																	error={priceField.error || currencyField.error}
																	disabled={loading()}
																	items={currencyListItems}
																	required
																	label="Currency & Price"
																/>
															)}
														</Field>
													)}
												</Field>

												<Field name={`meals.${index()}.hint`}>
													{(field, props) => (
														<Input
															{...props}
															value={field.value}
															error={field.error}
															label="Hint"
															disabled={loading()}
														/>
													)}
												</Field>
											</div>
										)}
									</For>
								</>
							)}
						</FieldArray>

						<button
							type="button"
							class="w-full btn btn-dash btn-info flex flex-col items-center justify-center gap-2 h-16"
							disabled={loading()}
							onclick={() => addAddon(AddonType.MEAL)}
						>
							<FaSolidUtensils class="size-6" />
							<span>Add Meal</span>
						</button>
					</Card>

					<Card title="Addons (Discounts)">
						<FieldArray name="discounts">
							{(fieldArray) => (
								<>
									{fieldArray.error && <div class="text-xs text-error mb-2">{fieldArray.error}</div>}

									<For each={fieldArray.items}>
										{(_, index) => (
											<div class="card border-2 border-base-300 hover:border-primary/50 p-4">
												<Field name={`discounts.${index()}.addon_type`}>
													{(field) => (
														<AddonActions
															typ={field.value || AddonType.ALL_SESSIONS_DISCOUNT}
															moveAddon={moveAddon}
															removeAddon={removeAddon}
															index={index}
															maxIdx={() => fieldArray.items.length}
															addAddon={addAddon}
														/>
													)}
												</Field>

												<Field name={`discounts.${index()}.id`}>
													{() => (
														<div class="hidden"></div>
													)}
												</Field>

												<Field name={`discounts.${index()}.title`}>
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

												<Field name={`discounts.${index()}.currency`}>
													{(currencyField, currencyProps) => (
														<Field name={`discounts.${index()}.price`} type="number">
															{(priceField, priceProps) => (
																<SelectInput
																	input={{ ...priceProps, value: priceField.value?.toString(), type: 'number', step: "0.01", inputmode: 'decimal' }}
																	select={{ ...currencyProps, value: currencyField.value }}
																	error={priceField.error || currencyField.error}
																	disabled={loading()}
																	items={currencyListItems}
																	required
																	label="Currency & Price"
																/>
															)}
														</Field>
													)}
												</Field>

												<Show when={getValues(form, 'discounts')?.at(index())?.addon_type === AddonType.EARLY_DISCOUNT}>
													<Field name={`discounts.${index()}.date_time`}>
														{(field, props) => (
															<Input
																{...props}
																value={field.value}
																error={field.error}
																label="End Date & Time"
																required
																disabled={loading()}
																type="datetime-local"
															/>
														)}
													</Field>
												</Show>
											</div>
										)}
									</For>
								</>
							)}
						</FieldArray>

						<div class="grid grid-cols-2 gap-4">
							<button
								type="button"
								class="w-full btn btn-dash btn-success flex flex-col items-center justify-center gap-2 h-16"
								disabled={loading()}
								onclick={() => addAddon(AddonType.ALL_SESSIONS_DISCOUNT)}
							>
								<FiDollarSign class="size-6" />
								<span>Add Full Course Discount</span>
							</button>

							<button
								type="button"
								class="w-full btn btn-dash btn-accent flex flex-col items-center justify-center gap-2 h-16"
								disabled={loading()}
								onclick={() => addAddon(AddonType.EARLY_DISCOUNT)}
							>
								<FaSolidKiwiBird class="size-6" />
								<span>Add Early Bird Discount</span>
							</button>
						</div>
					</Card>
				</div>
			</PageLayout>
		</Form >
	)
}

type Props = {
	moveAddon: (typ: AddonType, from: number, to: number) => void,
	removeAddon: (typ: AddonType, idx: number) => void,
	addAddon: (typ: AddonType, idx: number) => void,
	index: Accessor<number>,
	maxIdx: Accessor<number>,
	typ: AddonType,
}

const AddonActions: Component<Props> = ({ typ, moveAddon, index, maxIdx, removeAddon, addAddon }) => {
	return (
		<div class="flex items-center gap-3 mb-4">
			<Switch>
				<Match when={typ === AddonType.SESSION}>
					<div class="badge badge-primary">
						<FiCalendar class="size-3 mr-1" />
						Session
					</div>
				</Match>
				<Match when={typ === AddonType.MEAL}>
					<div class="badge badge-info">
						<FaSolidUtensils class="size-3 mr-1" />
						Meal
					</div>
				</Match>
				<Match when={typ === AddonType.ALL_SESSIONS_DISCOUNT}>
					<div class="badge badge-success">
						<FiDollarSign class="size-3 mr-1" />
						Full Course Discount
					</div>
				</Match>
				<Match when={typ === AddonType.EARLY_DISCOUNT}>
					<div class="badge badge-accent">
						<FaSolidKiwiBird class="size-3 mr-1" />
						Early Bird Discount
					</div>
				</Match>
			</Switch>

			<div class="flex-1" />

			<div class="flex items-center gap-1">
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => addAddon(typ, index())}
				>
					<FiCopy class="size-4" />
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => moveAddon(typ, index(), Math.max(0, index() - 1))}
				>
					<FiChevronUp class="size-4" />
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => moveAddon(typ, index(), Math.min(maxIdx(), index() + 1))}
				>
					<FiChevronDown class="size-4" />
				</button>
				<button
					type="button"
					class="btn btn-ghost btn-error"
					onclick={() => removeAddon(typ, index())}
				>
					<FiX class="size-4" />
				</button>
			</div>
		</div>
	)
}

export default CreateUpdateForm;
