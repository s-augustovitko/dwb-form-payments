import { Component, createSignal, Show } from "solid-js"
import { countryCodesList, currencyTypesList, EventDays, EventType, eventTypesList, FormDataResponse, idTypesList, mealTypesList, FormType, Currency, IdType, MealType } from "./types";
import {
  getMoneyDisplay,
  getDateTimeForBackEnd,
  getDateDisplay,
  RSA_PUB_ID,
  RSA_PUB_VAL,
  PUBLIC_KEY,
  RETURN_URL,
} from "../../utils";
import {
  Input, SelectInput, Select, MultiSelect,
  MultiSelectItem,
  notificationStore
} from "../../components"
import { Summary } from "./Summary";
import { getDaysFromSessions, getDaysList, getMealsList, getSessionList } from "./utils";
import { FormSchema, getSchema } from "./schemas";
import { FormRequestSchema, submitFormRequest, updatePaymentInfo } from "./requests";
import dayjs from "dayjs";
import { useNavigate } from "@solidjs/router";
import { createForm, getValue, SubmitHandler, valiForm } from "@modular-forms/solid";

const CourseForm: Component<FormDataResponse> = (props) => {
  const [loading, setLoading] = createSignal<boolean>(false)
  const [formId, setFormId] = createSignal<string>('')

  const navigate = useNavigate()

  const [formDataStore, { Form, Field }] = createForm<FormSchema>({
    validate: valiForm(getSchema(props.settings?.form_type || 'TALK')),
    initialValues: {
      id_type: IdType.DNI.toString(),
      country_code: "+51",
      emergency_contact_country_code: "+51",
      event_type: EventType.FULL.toString(),
      meal_type: MealType.REGULAR.toString(),
      currency: Currency.PEN.toString(),
      event_meals: [],
      event_days: [],
      event_sessions: [],
    },
    validateOn: 'input',
  });

  const getEventType = (): string => getValue(formDataStore, 'event_type') as string || EventType.FULL.toString()
  const getMealType = (): string => getValue(formDataStore, 'meal_type') as string || MealType.REGULAR.toString()
  const getCurrency = (): string => {
    return props.settings?.session_price_usd === 0 && props.settings?.meal_price_usd === 0
      ? Currency.PEN.toString()
      : (getValue(formDataStore, 'currency') as string || Currency.PEN.toString())
  }
  const getSessionPrice = (): number => (getCurrency() === Currency.USD ? props.settings?.session_price_usd : props.settings?.session_price_pen) || 0
  const getMealPrice = (): number => (getCurrency() === Currency.USD ? props.settings?.meal_price_usd : props.settings?.meal_price_pen) || 0

  const meals = (): MultiSelectItem[] => getMealsList(props.meals, getCurrency(), getMealPrice())
  const sessions = (): MultiSelectItem[] => getSessionList(props.sessions)

  const dayMap = (): Record<string, EventDays> => getDaysFromSessions(props.sessions)
  const days = (): MultiSelectItem[] => getDaysList(Object.values(dayMap()), getCurrency(), getSessionPrice())

  // const mealMap = (): Record<string, string> => convertListToMapping(meals())
  // const sessionMap = (): Record<string, string> => convertListToMapping(sessions())

  const getEventMeals = (): string[] => getMealType() === MealType.NONE.toString() ? [] : getValue(formDataStore, 'event_meals') as string[] || []

  const getEventSessions = (): string[] => {
    const eventDays = getValue(formDataStore, 'event_days') as string[] || []
    const eventSessions = getValue(formDataStore, 'event_sessions') as string[] || []

    switch (getEventType()) {
      case EventType.FULL.toString():
        return sessions().map(item => item.value)
      case EventType.DAYS.toString():
        return eventDays.reduce((acc: string[], newVal: string) => {
          return [...acc, ...(dayMap()[newVal]?.sessions || [])]
        }, [])
      case EventType.SESSIONS.toString():
        return eventSessions || []
    }

    return []
  }
  const getTotal = () => getEventSessions().length * getSessionPrice() + getEventMeals().length * getMealPrice()

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

      await updatePaymentInfo({
        form_id: formId(),
        token
      })
      navigate("/result?" + new URLSearchParams({
        form_id: formId()
      }).toString())
      return
    } catch (err) {
      notificationStore.error((err as any).message || "No se pudo procesar el pago");
    } finally {
      setLoading(false)
    }
  }

  const openCulqi = async () => {
    const email = (getValue(formDataStore, 'email') as string || "")?.trim().toLowerCase()
    const settings = {
      title: props.settings?.title || "Curso " + getDateDisplay(),
      currency: getCurrency(),
      amount: getTotal() * 100,
      xculqirsaid: RSA_PUB_ID,
      rsapublickey: RSA_PUB_VAL,
    }
    const client = {
      email,
    }
    const config = {
      settings,
      client,
    };

    (window as any).Culqi3DS.publicKey = PUBLIC_KEY;
    (window as any).Culqi3DS.settings = {
      charge: {
        totalAmount: getTotal() * 100,
        currency: getCurrency(),
        returnUrl: RETURN_URL,
      },
      card: {
        email,
      },
    };

    (window as any).Culqi = new (window as any).CulqiCheckout(PUBLIC_KEY, config);
    (window as any).Culqi.culqi = handleCulqiAction;

    await ((window as any).Culqi.open() as Promise<any>)
  }

  const handleSubmit: SubmitHandler<FormSchema> = async (values, _) => {
    setLoading(true)
    try {
      const data: FormRequestSchema = {
        form_id: formId() || undefined,
        settings_id: props.settings?.id || "",

        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        country_code: values.country_code || "+51",
        phone: values.phone,
        id_type: values.id_type || "DNI",
        id_value: values.id_value,

        meal_type: values.meal_type || "REGULAR",
        meals_count: getEventMeals().length,

        event_type: values.event_type || "FULL",
        sessions_count: getEventSessions().length,

        arrival_date: values.arrival_date ? getDateTimeForBackEnd(dayjs(values.arrival_date).startOf('d')) : undefined,
        departure_date: values.departure_date ? getDateTimeForBackEnd(dayjs(values.departure_date).endOf('d')) : undefined,

        medical_insurance: values.medical_insurance,

        emergency_contact_name: values.emergency_contact_name,
        emergency_contact_country_code: values.emergency_contact_country_code || "+51",
        emergency_contact_phone: values.emergency_contact_phone,
        emergency_contact_email: values.emergency_contact_email,

        currency: getCurrency(),
      }

      const { form_id } = await submitFormRequest(data)
      setFormId(form_id)
      if (getTotal() === 0) {
        navigate("/result?" + new URLSearchParams({
          form_id: formId()
        }).toString())
        return
      }

      await openCulqi()
    } catch (err) {
      notificationStore.error(`Could not process form: ${(err as any).message}`)
    } finally {
      setLoading(false)
    }
  };

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
      <Show when={props.settings?.form_type === FormType.SPECIAL}>
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

      <Show when={props.settings?.form_type === FormType.SPECIAL || props.settings?.form_type === FormType.COURSE}>
        <legend class="fieldset-legend mt-4">Evento</legend>

        <Show when={props.settings?.session_price_usd !== 0 || props.settings?.meal_price_usd !== 0}>
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

        <Show when={!!props.meals?.length && getMealType() !== MealType.NONE.toString()}>
          <Field name="event_meals" type="string[]">
            {(field, props) => (
              <MultiSelect
                {...props}
                value={field.value ?? []}
                error={field.error}
                disabled={loading()}
                label="Seleccion de Almuerzos"
                items={meals()}
              />
            )}
          </Field>
        </Show>

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

        <Show when={getEventType() === EventType.SESSIONS}>
          <Field name="event_sessions" type="string[]">
            {(field, props) => (
              <MultiSelect
                {...props}
                value={field.value ?? []}
                error={field.error}
                disabled={loading()}
                label={`Seleccion de Sesiones ${getMoneyDisplay(getCurrency(), getSessionPrice())} C/U`}
                items={sessions()}
              />
            )}
          </Field>
        </Show>

        <Show when={getEventType() === EventType.DAYS}>
          <Field name="event_days" type="string[]">
            {(field, props) => (
              <MultiSelect
                {...props}
                value={field.value ?? []}
                error={field.error}
                disabled={loading()}
                label="Seleccion de Dias"
                items={days()}
              />
            )}
          </Field>
        </Show>
      </Show>

      {/* TODO: Move to another page */}
      <Summary
        currency={getCurrency}
        session_price={getSessionPrice}
        meal_price={getMealPrice}
        meals={getEventMeals}
        sessions={getEventSessions}
        total={getTotal}
      />

      <button
        type="submit"
        class="w-full btn btn-primary"
        disabled={loading()}
      >
        {loading() ? "Confirmando Informacion..." : "Confirmar"}
      </button>
    </Form>
  );
}

export default CourseForm
