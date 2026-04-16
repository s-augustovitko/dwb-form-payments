import * as v from 'valibot';
import dayjs from 'dayjs';
import { Currency, EventType, FormType, MealType } from '../../utils';

const emptyEvents = {
  meal_type: v.optional(v.picklist(Object.values(MealType)), MealType.REGULAR),
  selected_meals: v.optional(v.array(v.string()), []),
  event_type: v.optional(v.picklist(Object.values(EventType)), EventType.ALL_SESSIONS),
  selected_sessions: v.optional(v.array(v.string()), []),
  selected_days: v.optional(v.array(v.string()), []),
};

const emptySpecial = {
  arrival_date: v.optional(v.string(), ""),
  departure_date: v.optional(v.string(), ""),
  medical_insurance: v.optional(v.string(), ""),
  emergency_contact_name: v.optional(v.string(), ""),
  emergency_contact_country_code: v.optional(v.string(), "+51"),
  emergency_contact_phone: v.optional(v.string(), ""),
  emergency_contact_email: v.optional(v.string(), ""),
};

const baseInputs = {
  first_name: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.maxLength(250, 'Debe tener menos de 250 caracteres'),
    v.regex(/^[\p{L}\s\-'.]+$/u, 'El campo tiene caracteres invalidos')
  ),
  last_name: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.maxLength(250, 'Debe tener menos de 250 caracteres'),
    v.regex(/^[\p{L}\s\-'.]+$/u, 'El campo tiene caracteres invalidos')
  ),
  email: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.email('Correo invalido'),
    v.maxLength(500, 'Debe tener menos de 500 caracteres')
  ),
  country_code: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.maxLength(16),
  ),
  phone: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.regex(/^[0-9]+$/, 'Telefono solo debe contener numeros'),
    v.minLength(3, 'Debe tener al menos 3 caracteres'),
    v.maxLength(17, 'Debe tener menos de 17 caracteres')
  ),
  id_type: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.maxLength(10),
  ),
  id_value: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.minLength(3, 'Debe tener al menos 3 caracteres'),
    v.maxLength(12, 'Debe tener menos de 12 caracteres')
  ),
  currency: v.optional(v.picklist(Object.values(Currency), "Moneda invalida")),
}

const fullEvents = {
  meal_type: v.picklist(Object.values(MealType), "Tipo de comida invalido"),
  selected_meals: v.optional(v.array(v.pipe(
    v.string(),
    v.uuid("comida seleccionada invalida"),
  )), []),
  event_type: v.picklist(Object.values(EventType), "Tipo de evento invalido"),
  selected_sessions: v.optional(v.array(v.pipe(
    v.string(),
    v.uuid("comida seleccionada invalida"),
  )), []),
  selected_days: v.optional(v.array(v.pipe(
    v.string(),
    v.maxLength(64, 'Debe tener menos de 64 caracteres'),
  )), []),
};

const fullSpecial = {
  arrival_date: v.optional(v.pipe(
    v.string(),
    v.check((date) => dayjs(date).isValid(),
      "Fecha invalida"),
    v.check((date) => dayjs(date).isAfter(dayjs().subtract(3, 'month')),
      "Fecha no puede ser anterior a 3 meses"),
    v.check((date) => dayjs(date).isBefore(dayjs().add(3, 'month')),
      "Fecha no puede ser posterior a 3 meses")
  )),
  departure_date: v.optional(v.pipe(
    v.string(),
    v.check((date) => dayjs(date).isValid(), "Fecha invalida"),
    v.check((date) => dayjs(date).isAfter(dayjs().subtract(1, 'd'), 'd'),
      "'La fecha no puede ser anterior a hoy"),
    v.check((date) => dayjs(date).isBefore(dayjs().add(3, 'month')),
      "Fecha no puede ser posterior a 3 meses")
  )),
  medical_insurance: v.optional(v.pipe(
    v.string(),
    v.maxLength(64, 'Debe tener menos de 64 caracteres'),
  )),
  emergency_contact_name: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.maxLength(500, 'Debe tener menos de 500 caracteres'),
    v.regex(/^[\p{L}\s\-'.]+$/u, 'El campo tiene caracteres invalidos')
  ),
  emergency_contact_country_code: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.maxLength(16),
  ),
  emergency_contact_phone: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.regex(/^[0-9]+$/, 'Telefono solo debe contener numeros'),
    v.minLength(3, 'Debe tener al menos 3 caracteres'),
    v.maxLength(17, 'Debe tener menos de 17 caracteres')
  ),
  emergency_contact_email: v.optional(v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.email('Correo invalido'),
    v.maxLength(500, 'Debe tener menos de 500 caracteres')
  )),
}

const conferenceSchema = v.pipe(
  v.object({
    ...baseInputs,
    ...emptySpecial,
    ...emptyEvents,
  }),

  v.forward(
    v.check((input) => {
      if (input.id_type === 'DNI') return /^[0-9]{8}$/.test(input.id_value);
      return /^[a-zA-Z0-9]{6,12}$/.test(input.id_value);
    }, (_) => 'Documento invalido'),
    ['id_value']
  ),
);

const specialSchema = v.pipe(
  v.object({
    ...baseInputs,
    ...fullEvents,
    ...fullSpecial,
  }),

  v.forward(
    v.check((input) => {
      if (input.id_type === 'DNI') return /^[0-9]{8}$/.test(input.id_value);
      return /^[a-zA-Z0-9]{6,12}$/.test(input.id_value);
    }, (_) => 'Documento invalido'),
    ['id_value']
  ),

  v.forward(
    v.check((input) => {
      if (input.meal_type !== MealType.NONE) {
        return input.selected_meals.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos una comida"),
    ['selected_meals']
  ),

  v.forward(
    v.check((input) => {
      if (!input.arrival_date || !input.departure_date) {
        return true
      }

      return dayjs(input.arrival_date).isBefore(input.departure_date)
    }, (_) => "Fecha de regreso debe ser posterior a la fecha de llegada"),
    ['departure_date']
  ),

  v.forward(
    v.check((input) => {
      if (input.event_type === EventType.PER_DAY) {
        return input.selected_days.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos un dia"),
    ['selected_days']
  ),

  v.forward(
    v.check((input) => {
      if (input.event_type === EventType.PER_SESSION) {
        return input.selected_sessions.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos una sesion"),
    ['selected_sessions']
  )
);

// 3. COURSE SCHEMA
const courseSchema = v.pipe(
  v.object({
    ...baseInputs,
    ...fullEvents,
    ...emptySpecial,
  }),

  v.forward(
    v.check((input) => {
      if (input.id_type === 'DNI') return /^[0-9]{8}$/.test(input.id_value);
      return /^[a-zA-Z0-9]{6,12}$/.test(input.id_value);
    }, (_) => 'Documento invalido'),
    ['id_value']
  ),

  v.forward(
    v.check((input) => {
      if (input.meal_type !== MealType.NONE) {
        return input.selected_meals.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos una comida"),
    ['selected_meals']
  ),

  v.forward(
    v.check((input) => {
      if (input.event_type === EventType.PER_DAY) {
        return input.selected_days.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos un dia"),
    ['selected_days']
  ),

  v.forward(
    v.check((input) => {
      if (input.event_type === EventType.PER_SESSION) {
        return input.selected_sessions.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos una sesion"),
    ['selected_sessions']
  )
);

export function getSchema(typ: FormType) {
  switch (typ) {
    case FormType.CONFERENCE: return conferenceSchema;
    case FormType.COURSE: return courseSchema;
    case FormType.SPECIAL: return specialSchema;
    default: return conferenceSchema;
  }
}

export type SubmissionSchema = v.InferInput<ReturnType<typeof getSchema>>;
