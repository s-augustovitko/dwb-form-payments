import { Component, createMemo, createResource, createSignal, Show } from "solid-js";
import { Input, MultiSelect, notificationStore, PageLayout, Select, SelectInput } from "../../components";
import { Currency, EventType, FormType, getMoneyDisplay, IdType, MealType } from "../../utils";
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
import { createForm, getValue, reset, setValues, SubmitHandler, valiForm } from "@modular-forms/solid";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { getSchema, SubmissionSchema } from "./schema";
import { getFormInfo, getFormSubmission, SubmissionRequest, submissionRequest } from "./requests";
import { FormInfoResponse } from "./types";

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
			event_type: EventType.ALL_SESSIONS,
			meal_type: MealType.REGULAR,
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

	const getSelectedMeals = (): string[] =>
		getSelectedMealType() === MealType.NONE ?
			[] :
			getValue(formDataStore, 'selected_meals') || []

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

	const getTotal = () => {
		const selectedAddonsSet = new Set(getSelectedAddons());
		return (formInfo?.addons || []).reduce((acc, item) =>
			selectedAddonsSet.has(item.id) ? acc + Number(item.price) : acc
			, 0);
	}

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
							value={field.value}
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
								label="Seleccion de Sesiones"
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
							value={field.value}
							error={field.error}
							required
							disabled={loading()}
							items={mealTypesList}
							label="Tipo de Comida"
						/>
					)}
				</Field>

				<Show when={addonsList().meals.length > 0 && getSelectedMealType() !== MealType.NONE}>
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
							<tr>
								<th>Subtotal</th>
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
