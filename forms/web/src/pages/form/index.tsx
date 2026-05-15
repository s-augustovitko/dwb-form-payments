import { Component, createEffect, createMemo, createResource, createSignal, Show } from "solid-js";
import { Input, MultiSelect, notificationStore, PageLayout, Select, SelectInput } from "../../components";
import { AddonType, Currency, EventType, FormType, getMoneyDisplay, IdType, MealType, normalizeDate } from "../../utils";
import {
	countryCodesList,
	currencyTypesList,
	eventTypesList,
	idTypesList,
	mealTypesList,
	transformAddonsList,
	transformSubmissionResponseToSchema,
	transformSubmissionSchemaToRequest
} from './transforms'
import { createForm, getValue, reset, setValue, setValues, SubmitHandler, valiForm } from "@modular-forms/solid";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { getSchema, SubmissionSchema } from "./schema";
import { getFormInfo, getFormSubmission, SubmissionRequest, submissionRequest } from "./requests";
import { FormInfoResponse } from "./types";
import dayjs from "dayjs";

type SearchParams = {
	submission_id?: string
}

const Form: Component = () => {
	const [formInfo] = createResource(getFormInfo);
	return (

		<PageLayout
			title={formInfo()?.form.title || "Curso"}
			description={formInfo()?.form.description}
		>
			<Show when={formInfo.state === 'ready'}>
				<FormContent formInfo={formInfo()} />
			</Show>
		</PageLayout>
	)
}

type Props = {
	formInfo: FormInfoResponse | undefined
}

const FormContent: Component<Props> = ({ formInfo }) => {
	const [loading, setLoading] = createSignal<boolean>(false)
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams<SearchParams>()

	const [formDataStore, { Form, Field }] = createForm<SubmissionSchema>({
		validate: valiForm(getSchema(formInfo?.form.form_type || FormType.CONFERENCE)),
		initialValues: {
			id_type: IdType.DNI,
			country_code: "+51",
			emergency_contact_country_code: "+51",
			meal_type: undefined,
			event_type: undefined,
			currency: Currency.PEN,
			selected_meals: [],
			selected_days: [],
			selected_sessions: [],
		},
		validateOn: 'input',
	});

	const [_res] = createResource(() => searchParams.submission_id, async (id) => {
		if (!id) return null;

		setLoading(true)
		try {
			const res = await getFormSubmission(id);

			const data = transformSubmissionResponseToSchema(res);
			reset(formDataStore, { initialValues: data });
			setValues(formDataStore, 'selected_meals', data.selected_meals || []);
			setValues(formDataStore, 'selected_sessions', data.selected_sessions || []);
			setValues(formDataStore, 'selected_days', data.selected_days || []);

			return res
		} catch (err) {
			notificationStore.error(
				Error.isError(err) ?
					err.message :
					err as string || "No se pudo obtener las respuestas del formulario");

			setSearchParams({})
			return null
		} finally {
			setLoading(false)
		}
	});

	const getCurrency = (): Currency => getValue(formDataStore, 'currency') ||
		Currency.PEN

	const showCurrency = (): boolean => (formInfo?.addons || [])
		.some(item => item.currency === Currency.USD)

	const addonsList = createMemo(() =>
		transformAddonsList(formInfo?.addons || [], getCurrency()), {})

	const getSelectedEventType = (): EventType => getValue(formDataStore, 'event_type') ||
		EventType.ALL_SESSIONS

	const getSelectedMealType = (): MealType => getValue(formDataStore, 'meal_type') ||
		MealType.REGULAR

	const getSelectedMeals = (): string[] => {
		if (isEarlyBundleActive()) {
			return addonsList().meals.map(m => m.value)
		}
		return getSelectedMealType() === MealType.NONE
			? []
			: getValue(formDataStore, 'selected_meals') || []
	}

	const getSelectedSessions = (): string[] => {
		const selectedDays: string[] = getValue(formDataStore, 'selected_days') || []
		const selectedSessions: string[] = getValue(formDataStore, 'selected_sessions') || []
		const addons = addonsList()

		switch (getSelectedEventType()) {
			case EventType.ALL_SESSIONS:
				return addons.sessions.map(item => item.value)
			case EventType.PER_DAY:
				return selectedDays.reduce((acc, item) => [
					...acc,
					...(addons.daysMap[item]?.sessions || [])
				], [] as string[])
			case EventType.PER_SESSION:
				return selectedSessions
		}
	}

	const getSelectedAddons = () => [...getSelectedSessions(), ...getSelectedMeals()];

	const getSubtotal = () => {
		const selectedAddonsSet = new Set(getSelectedAddons());
		return (formInfo?.addons || []).reduce((acc, item) =>
			selectedAddonsSet.has(item.id) ? acc + Number(item.price) : acc
			, 0);
	}

	const getAllSessionsDiscount = () => formInfo?.addons.find((item) => {
		if (item.addon_type !== AddonType.ALL_SESSIONS_DISCOUNT || item.currency !== getCurrency())
			return false

		if (getSelectedSessions().length !== addonsList().sessions.length)
			return false

		return true
	})

	const getEarlyDiscount = () => formInfo?.addons.find((item) => {
		if (item.addon_type !== AddonType.EARLY_DISCOUNT || item.currency !== getCurrency())
			return false

		if (getSelectedSessions().length !== addonsList().sessions.length)
			return false

		if (!item.date_time || dayjs(normalizeDate(item.date_time)).isBefore(new Date()))
			return false

		return true
	})

	const isEarlyBundleActive = (): boolean =>
		!!getEarlyDiscount() &&
		addonsList().meals.length > 0 &&
		getSelectedMealType() !== MealType.NONE

	const getMealsTotal = (): number =>
		(formInfo?.addons || [])
			.filter(a => a.addon_type === AddonType.MEAL && a.currency === getCurrency())
			.reduce((acc, a) => acc + Number(a.price), 0)

	const getEarlyDiscountAmount = (): number => {
		const earlyDiscount = getEarlyDiscount()
		if (!earlyDiscount) return 0
		return Number(earlyDiscount.price) + (isEarlyBundleActive() ? getMealsTotal() : 0)
	}

	// Predicate intentionally excludes getSelectedMealType(): the current selection
	// must not gate which options are shown, or NONE would only hide after the user
	// picks something else.
	const availableMealTypes = createMemo(() => {
		if (!!getEarlyDiscount() && addonsList().meals.length > 0) {
			return mealTypesList.filter(item => item.value !== MealType.NONE)
		}
		return mealTypesList
	})

	// If the user picked NONE before bundle conditions held (e.g. partial sessions,
	// then they switched to all sessions), the bundle rules supersede that choice:
	// reset to REGULAR so the bundled meals get a meal-type. Also applies to stored
	// submissions reloaded with a stale NONE.
	createEffect(() => {
		if (
			!!getEarlyDiscount() &&
			addonsList().meals.length > 0 &&
			getSelectedMealType() === MealType.NONE
		) {
			setValue(formDataStore, 'meal_type', MealType.REGULAR)
		}
	})

	// When the bundle is active, mirror all available meal IDs into the form field
	// so schema validation (which requires selected_meals.length > 0 when meal_type
	// is not NONE) passes. The multi-select UI is hidden in this state, so the user
	// never sets selected_meals manually.
	// Note: we intentionally do NOT clear selected_meals when the bundle deactivates;
	// the reappearing multi-select will show all checked, which is a sensible default,
	// and the user can freely deselect.
	createEffect(() => {
		if (isEarlyBundleActive()) {
			const allMealIds = addonsList().meals.map(m => m.value)
			const current = getValue(formDataStore, 'selected_meals') || []
			if (current.length !== allMealIds.length) {
				setValue(formDataStore, 'selected_meals', allMealIds)
			}
		}
	})

	const getDiscountTotal = (): number => {
		const allSessionsDiscount = getAllSessionsDiscount()

		let total = getEarlyDiscountAmount()
		if (allSessionsDiscount) {
			total += Number(allSessionsDiscount.price)
		}

		return total
	}

	const getTotal = () => getSubtotal() - getDiscountTotal()

	const handleSubmit: SubmitHandler<SubmissionSchema> = async (values, _) => {
		setLoading(true)
		try {
			const data: SubmissionRequest = transformSubmissionSchemaToRequest(
				values,
				getSelectedAddons(),
				searchParams.submission_id
			)

			const { submission_id } = await submissionRequest(data)
			setSearchParams({ submission_id })

			navigate('/checkout/' + submission_id)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			notificationStore.error(`No se pudo registrar: ${errorMessage}`);
		} finally {
			setLoading(false)
		}
	}

	return (
		<Form onSubmit={handleSubmit}>
			<legend class="fieldset-legend">Datos Personales</legend>

			<Field name="first_name">
				{(field, props) => (
					<Input
						{...props}
						value={field.value}
						error={field.error}
						required
						label="Nombre(s)"
						disabled={loading()}
					/>
				)}
			</Field>

			<Field name="last_name">
				{(field, props) => (
					<Input
						{...props}
						value={field.value}
						error={field.error}
						required
						disabled={loading()}
						label="Apellido(s)"
					/>
				)}
			</Field>

			<Field name="email">
				{(field, props) => (
					<Input
						{...props}
						value={field.value}
						error={field.error}
						required
						disabled={loading()}
						label="Email"
						type="email"
						inputmode="email"
					/>
				)}
			</Field>

			<Field name="country_code">
				{(selectField, selectProps) => (
					<Field name="phone">
						{(inputField, inputProps) => (
							<SelectInput
								input={{ ...inputProps, value: inputField.value, type: 'tel', inputmode: 'tel' }}
								select={{ ...selectProps, value: selectField.value }}
								error={inputField.error || selectField.error}
								disabled={loading()}
								items={countryCodesList}
								required
								label="Telefono"
							/>
						)}
					</Field>
				)}
			</Field>

			<Field name="id_type">
				{(selectField, selectProps) => (
					<Field name="id_value">
						{(inputField, inputProps) => (
							<SelectInput
								input={{ ...inputProps, value: inputField.value }}
								select={{ ...selectProps, value: selectField.value }}
								error={inputField.error || selectField.error}
								disabled={loading()}
								items={idTypesList}
								required
								label="Documento de Identidad"
							/>
						)}
					</Field>
				)}
			</Field>

			<Show when={formInfo?.form.form_type === FormType.SPECIAL}>
				<Field name="arrival_date">
					{(field, props) => (
						<Input
							{...props}
							value={field.value}
							error={field.error}
							label="Fecha de Llegada"
							disabled={loading()}
							type="date"
						/>
					)}
				</Field>

				<Field name="departure_date">
					{(field, props) => (
						<Input
							{...props}
							value={field.value}
							error={field.error}
							label="Fecha de Regreso"
							disabled={loading()}
							type="date"
						/>
					)}
				</Field>

				<Field name="medical_insurance">
					{(field, props) => (
						<Input
							{...props}
							value={field.value}
							error={field.error}
							label="Seguro Medico"
							disabled={loading()}
						/>
					)}
				</Field>

				<legend class="fieldset-legend mt-4">Contacto de Emergencia</legend>

				<Field name="emergency_contact_name">
					{(field, props) => (
						<Input
							{...props}
							value={field.value}
							error={field.error}
							label="Contacto de Emergencia: Nombre y Apellido"
							required
							disabled={loading()}
						/>
					)}
				</Field>

				<Field name="emergency_contact_country_code">
					{(selectField, selectProps) => (
						<Field name="emergency_contact_phone">
							{(inputField, inputProps) => (
								<SelectInput
									input={{ ...inputProps, value: inputField.value, type: 'tel', inputmode: 'tel' }}
									select={{ ...selectProps, value: selectField.value }}
									error={inputField.error || selectField.error}
									disabled={loading()}
									items={countryCodesList}
									required
									label="Contacto de Emergencia: Telefono"
								/>
							)}
						</Field>
					)}
				</Field>


				<Field name="emergency_contact_email">
					{(field, props) => (
						<Input
							{...props}
							value={field.value}
							error={field.error}
							required
							disabled={loading()}
							label="Contacto de Emergencia: Email"
							type="email"
							inputmode="email"
						/>
					)}
				</Field>
			</Show>

			<Show when={showCurrency()}>
				<Field name="currency">
					{(field, props) => (
						<Select
							{...props}
							value={field.value}
							error={field.error}
							required
							disabled={loading()}
							items={currencyTypesList}
							label="Moneda"
						/>
					)}
				</Field>
			</Show>

			<Show when={formInfo?.form.form_type !== FormType.CONFERENCE}>
				<legend class="fieldset-legend mt-4">Evento</legend>
				<Field name="event_type">
					{(field, props) => (
						<Select
							{...props}
							value={field.value || ""}
							error={field.error}
							required
							disabled={loading()}
							items={eventTypesList}
							label="Eventos"
						/>
					)}
				</Field>

				<Show when={getSelectedEventType() === EventType.PER_SESSION}>
					<Field name="selected_sessions" type="string[]">
						{(field, props) => (
							<MultiSelect
								{...props}
								value={field.value ?? []}
								error={field.error}
								disabled={loading()}
								label="Seleccion de Sesiones y Conferencias"
								items={addonsList().sessions}
							/>
						)}
					</Field>
				</Show>

				<Show when={getSelectedEventType() === EventType.PER_DAY}>
					<Field name="selected_days" type="string[]">
						{(field, props) => (
							<MultiSelect
								{...props}
								value={field.value ?? []}
								error={field.error}
								disabled={loading()}
								label="Seleccion de Dias"
								items={addonsList().days}
							/>
						)}
					</Field>
				</Show>

				<legend class="fieldset-legend mt-4">Comidas</legend>

				<Field name="meal_type">
					{(field, props) => (
						<Select
							{...props}
							value={field.value || ""}
							error={field.error}
							required
							disabled={loading()}
							items={availableMealTypes()}
							label="Tipo de Comida"
						/>
					)}
				</Field>

				<Show when={isEarlyBundleActive()}>
					<div role="alert" class="alert alert-success mt-4">
						<span>Todas las comidas estan incluidas con el descuento de Pre-Venta</span>
					</div>
				</Show>

				<Show when={!isEarlyBundleActive() && addonsList().meals.length > 0 && getSelectedMealType() !== MealType.NONE}>
					<Field name="selected_meals" type="string[]">
						{(field, props) => (
							<MultiSelect
								{...props}
								value={field.value ?? []}
								error={field.error}
								disabled={loading()}
								label="Seleccion de Almuerzos"
								items={addonsList().meals}
							/>
						)}
					</Field>
				</Show>
			</Show>

			<div class="grid w-full gap-4 my-4">
				<h2 class="text-lg font-bold">Resumen</h2>

				<div class="overflow-x-scroll bg-base-100 rounded-box shadow-md">
					<table class="table">
						<thead>
							<Show when={getEarlyDiscount() || getAllSessionsDiscount()}>
								<tr class="text-xs">
									<td>Subtotal</td>
									<td>{getMoneyDisplay(getCurrency(), getSubtotal())}</td>
								</tr>
							</Show>

							<Show when={getEarlyDiscount()}>
								<tr class="text-xs">
									<td>{getEarlyDiscount()?.title}{isEarlyBundleActive() ? " (incluye comidas)" : ""}</td>
									<td class="text-success">- {getMoneyDisplay(getEarlyDiscount()?.currency, getEarlyDiscountAmount())}</td>
								</tr>
							</Show>
							<Show when={getAllSessionsDiscount()}>
								<tr class="text-xs">
									<td>{getAllSessionsDiscount()?.title}</td>
									<td class="text-success">- {getMoneyDisplay(getAllSessionsDiscount()?.currency, Number(getAllSessionsDiscount()?.price))}</td>
								</tr>
							</Show>

							<tr>
								<th>Total</th>
								<th>{getMoneyDisplay(getCurrency(), getTotal())}</th>
							</tr>
						</thead>
					</table>
				</div>
			</div>

			<button
				type="submit"
				class="w-full btn btn-primary"
				disabled={loading()}
			>
				{loading() ? "Confirmando Informacion..." : "Siguiente"}
			</button>
		</Form>
	)
}

export default Form;
