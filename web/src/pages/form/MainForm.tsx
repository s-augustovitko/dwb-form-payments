import { Component, createSignal, Show } from "solid-js"
import { countryCodesList, currencyTypesList, EventDays, EventType, eventTypesList, FormDataResponse, idTypesList, mealTypesList, FormType, Currency } from "./types";
import {
  idValidate, getMoneyDisplay, eventDaysValidate, eventSessionsValidate,
  createForm,
  getDateTimeForBackEnd,
  getDateDisplay,
  RSA_PUB_ID,
  RSA_PUB_VAL,
  PUBLIC_KEY,
  notBeforeDate,
} from "../../utils";
import {
  Input, SelectInput, Select, MultiSelect,
  MultiSelectItem,
  notificationStore
} from "../../components"
import { Summary } from "./Summary";
import { getDaysFromSessions, getDaysList, getMealsList, getSessionList } from "./utils";
import { getSchema } from "./schemas";
import { FormRequestSchema, submitFormRequest, updatePaymentInfo } from "./requests";
import dayjs from "dayjs";
import { useNavigate } from "@solidjs/router";

const CourseForm: Component<FormDataResponse> = (props) => {
  const [loading, setLoading] = createSignal<boolean>(false)
  const [formId, setFormId] = createSignal<string>('')
  const courseForm = createForm(getSchema(props.settings?.form_type || FormType.TALK))
  const navigate = useNavigate()

  const getCurrency = (): string => courseForm.fields.currency?.get() || Currency.PEN
  const getSessionPrice = (): number => (getCurrency() === Currency.USD ? props.settings?.session_price_usd : props.settings?.session_price_pen) || 0
  const getMealPrice = (): number => (getCurrency() === Currency.USD ? props.settings?.meal_price_usd : props.settings?.meal_price_pen) || 0

  const meals = (): MultiSelectItem[] => getMealsList(props.meals, getCurrency(), getMealPrice())
  const sessions = (): MultiSelectItem[] => getSessionList(props.sessions)

  const dayMap = (): Record<string, EventDays> => getDaysFromSessions(props.sessions)
  const days = (): MultiSelectItem[] => getDaysList(Object.values(dayMap()), getCurrency(), getSessionPrice())

  // const mealMap = (): Record<string, string> => convertListToMapping(meals())
  // const sessionMap = (): Record<string, string> => convertListToMapping(sessions())

  const getEventMeals = (): string[] => courseForm.fields.event_meals?.get() || []
  const getEventSessions = (): string[] => {
    switch (courseForm.fields.event_type?.get() || EventType.FULL.toString()) {
      case EventType.FULL.toString():
        return sessions().map(item => item.value)
      case EventType.DAYS.toString():
        return courseForm.fields.event_days?.get()?.reduce((acc: string[], newVal: string) => {
          return [...acc, ...dayMap()[newVal]?.sessions]
        }, [])
      case EventType.SESSIONS.toString():
        return courseForm.fields.event_sessions?.get() || []
    }

    return []
  }
  const getTotal = () => (getEventSessions().length || 0) * getSessionPrice() + getEventMeals().length * getMealPrice()

  const handleCulqiAction = async () => {
    setLoading(true)
    try {
      await (window as any).Culqi?.close()

      const token = (window as any).Culqi?.token?.id;
      const error = (window as any).Culqi.error;
      if (!!error) {
        throw new Error(error.user_message || "No se pudo procesar el pago")
      }
      if (!token) {
        notificationStore.error("El pago fue cancelado o no generó token")
        return
      }

      const values = courseForm.values()
      const { payment_id, payment_status } = await updatePaymentInfo({
        form_id: formId(),
        token
      })
      navigate("/success?" + new URLSearchParams({
        full_name: values.first_name + " " + values.last_name,
        email: values.email?.toLowerCase(),
        payment_id,
        payment_status,
        form_id: formId()
      }).toString())
      return
    } catch (err) {
      notificationStore.error("No se pudo procesar el pago");
    } finally {
      setLoading(false)
    }
  }

  const openCulqi = async () => {
    const email = (courseForm.fields.email?.get() || "")?.trim().toLowerCase()
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
        returnUrl: "https://app.caminodeldiamante.pe",
      },
      card: {
        email,
      },
    };

    (window as any).Culqi = new (window as any).CulqiCheckout(PUBLIC_KEY, config);
    (window as any).Culqi.culqi = handleCulqiAction;

    await ((window as any).Culqi.open() as Promise<any>)
  }

  const submit = async (e: Event) => {
    e.preventDefault();
    if (!courseForm.validate()) return

    setLoading(true)
    try {
      const values = courseForm.values()
      const data: FormRequestSchema = {
        form_id: formId() || undefined,
        settings_id: props.settings?.id || "",

        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        country_code: values.country_code,
        phone: values.phone,
        id_type: values.id_type || "DNI",
        id_value: values.id_value,

        meal_type: values.meal_type,
        meals_count: getEventMeals().length,

        event_type: values.event_type,
        sessions_count: getEventSessions().length,

        arrival_date: values.arrival_date ? getDateTimeForBackEnd(dayjs(values.arrival_date).startOf('d')) : undefined,
        departure_date: values.departure_date ? getDateTimeForBackEnd(dayjs(values.departure_date).endOf('d')) : undefined,

        medical_insurance: values.medical_insurance,

        emergency_contact_name: values.emergency_contact_name,
        emergency_contact_country_code: values.emergency_contact_country_code,
        emergency_contact_phone: values.emergency_contact_phone,
        emergency_contact_email: values.emergency_contact_email,

        currency: getCurrency(),
      }

      const { form_id } = await submitFormRequest(data)
      setFormId(form_id)
      if (getTotal() === 0) {
        navigate("/success?" + new URLSearchParams({
          full_name: values.first_name + " " + values.last_name,
          email: values.email?.toLowerCase(),
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
  }

  return (
    <form onsubmit={submit}>
      <legend class="fieldset-legend">Datos Personales</legend>

      <Input
        title="Nombre(s) *"
        field={courseForm.fields.first_name}
        disabled={loading}
      />

      <Input
        title="Apellido(s) *"
        field={courseForm.fields.last_name}
        disabled={loading}
      />

      <Input
        type="email"
        inputmode="email"
        title="Email *"
        field={courseForm.fields.email}
        disabled={loading}
      />

      <SelectInput
        type="tel"
        inputmode="tel"
        title={"Telefono *"}
        fieldInput={courseForm.fields.phone}
        fieldSelect={courseForm.fields.country_code}
        itemsSelect={countryCodesList}
        disabled={loading}
      />

      <SelectInput
        title={"Documento de Identidad *"}
        fieldInput={courseForm.fields.id_value}
        fieldSelect={courseForm.fields.id_type}
        itemsSelect={idTypesList}
        validateInput={() => idValidate(courseForm.fields.id_type.get())}
        disabled={loading}
      />

      <Show when={props.settings?.form_type === FormType.SPECIAL}>
        <Input
          type="date"
          title="Fecha de Llegada (Opcional)"
          field={courseForm.fields.arrival_date}
          disabled={loading}
        />

        <Input
          type="date"
          title="Fecha de Regreso (Opcional)"
          field={courseForm.fields.departure_date}
          validate={() => notBeforeDate(courseForm.fields.arrival_date.get())}
          disabled={loading}
        />

        <Input
          title="Seguro Medico (Opcional)"
          field={courseForm.fields.medical_insurance}
          disabled={loading}
        />

        <legend class="fieldset-legend mt-4">Contacto de Emergencia</legend>

        <Input
          title="Contacto de Emergencia: Nombre y Apellido *"
          field={courseForm.fields.emergency_contact_name}
          disabled={loading}
        />

        <SelectInput
          title={"Telefono *"}
          type="tel"
          inputmode="tel"
          fieldInput={courseForm.fields.emergency_contact_phone}
          fieldSelect={courseForm.fields.emergency_contact_country_code}
          itemsSelect={countryCodesList}
          disabled={loading}
        />

        <Input
          type="email"
          inputmode="email"
          title="Contacto de Emergencia: Email (Opcional)"
          field={courseForm.fields.emergency_contact_email}
          disabled={loading}
        />
      </Show>

      <Show when={props.settings?.form_type === FormType.SPECIAL || props.settings?.form_type === FormType.COURSE}>
        <legend class="fieldset-legend mt-4">Evento</legend>

        <Select
          title={"Moneda *"}
          field={courseForm.fields.currency}
          items={currencyTypesList}
          disabled={loading}
        />

        <Select
          title={"Tipo de Comida *"}
          field={courseForm.fields.meal_type}
          items={mealTypesList}
          disabled={loading}
        />

        <Show when={!!props.meals?.length}>
          <MultiSelect
            title={"Seleccion de Almuerzos *"}
            field={courseForm.fields.event_meals}
            items={meals}
            disabled={loading}
          />
        </Show>

        <Select
          title={"Eventos *"}
          field={courseForm.fields.event_type}
          items={eventTypesList}
          disabled={loading}
        />

        <Show when={courseForm.fields.event_type.get() === EventType.SESSIONS}>
          <MultiSelect
            title={`Seleccion de Sesiones ${getMoneyDisplay(getCurrency(), getSessionPrice())} C/U *`}
            field={courseForm.fields.event_sessions}
            items={sessions}
            validate={() => eventSessionsValidate((courseForm.fields.event_type).get())}
            disabled={loading}
          />
        </Show>

        <Show when={courseForm.fields.event_type.get() === EventType.DAYS}>
          <MultiSelect
            title={"Seleccion de Dias *"}
            field={courseForm.fields.event_days}
            items={days}
            validate={() => eventDaysValidate((courseForm.fields.event_type).get())}
            disabled={loading}
          />
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
    </form>
  );
}

export default CourseForm
