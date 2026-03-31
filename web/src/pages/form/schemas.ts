import * as v from 'valibot';
import dayjs from 'dayjs';
import { EventType } from './types';

const emptyEvents = {
  meal_type: v.optional(v.string(), "REGULAR"),
  event_meals: v.optional(v.array(v.string()), []),
  event_type: v.optional(v.string(), "FULL"),
  event_sessions: v.optional(v.array(v.string()), []),
  event_days: v.optional(v.array(v.string()), []),
};

const emptySpecial = {
  arrival_date: v.optional(v.string(), ""),
  departure_date: v.optional(v.string(), ""),
  medical_insurance: v.optional(v.string(), ""),
  emergency_contact_name: v.optional(v.string(), ""),
  emergency_contact_country_code: v.optional(v.string(), "+51"),
  emergency_contact_phone: v.optional(v.string(), ""),
  emergency_contact_email: v.optional(v.string(), ""),
  currency: v.optional(v.string(), "PEN"),
};

const fullEvents = {
  meal_type: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.maxLength(10, 'Debe tener menos de 10 caracteres'),
  ),
  event_meals: v.optional(v.array(v.pipe(
    v.string(),
    v.maxLength(64, 'Debe tener menos de 64 caracteres'),
  )), []),
  event_type: v.pipe(
    v.string(),
    v.nonEmpty('Campo es requerido'),
    v.maxLength(10, 'Debe tener menos de 10 caracteres'),
  ),
  event_sessions: v.optional(v.array(v.pipe(
    v.string(),
    v.maxLength(64, 'Debe tener menos de 64 caracteres')
  )), []),
  event_days: v.optional(v.array(v.pipe(
    v.string(),
    v.maxLength(64, 'Debe tener menos de 64 caracteres'),
  )), []),
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
    v.maxLength(64),
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
  )
}

// 1. TALK SCHEMA
const talkSchema = v.pipe(
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

// 2. SPECIAL SCHEMA
const specialSchema = v.pipe(
  v.object({
    ...baseInputs,
    ...fullEvents,

    arrival_date: v.optional(v.pipe(
      v.string(),
      v.check((val) => dayjs(val).isValid(), 'Fecha invalida'),
      v.check((val) => {
        const min = dayjs().subtract(3, 'month').startOf('d');
        return !dayjs(val).isBefore(min);
      }, 'La fecha no puede ser anterior a hace 3 meses'),
      v.check((val) => {
        const max = dayjs().add(3, 'month').endOf('d');
        return !dayjs(val).isAfter(max);
      }, 'La fecha no puede ser posterior a 3 meses')
    )),
    departure_date: v.optional(v.pipe(
      v.string(),
      v.check((val) => dayjs(val).isValid(), 'Fecha invalida'),
      v.check((val) => {
        const min = dayjs().startOf('d');
        return !dayjs(val).isBefore(min);
      }, 'La fecha no puede ser anterior a hoy'),
      v.check((val) => {
        const max = dayjs().add(3, 'month').endOf('d');
        return !dayjs(val).isAfter(max);
      }, 'La fecha no puede ser posterior a 3 meses')
    )),
    medical_insurance: v.optional(v.pipe(v.string(), v.maxLength(64, 'Debe tener menos de 64 caracteres'))),
    emergency_contact_name: v.pipe(v.string(), v.nonEmpty('Campo es requerido'), v.maxLength(500)),
    emergency_contact_country_code: v.pipe(v.string(), v.nonEmpty('Campo es requerido'), v.maxLength(5)),
    emergency_contact_phone: v.pipe(
      v.string(),
      v.nonEmpty('Campo es requerido'),
      v.regex(/^[0-9]+$/, 'Telefono solo debe contener numeros'),
      v.minLength(3, 'Debe tener al menos 3 caracteres'),
      v.maxLength(17, 'Debe tener menos de 17 caracteres')
    ),
    emergency_contact_email: v.pipe(v.string(), v.email('Correo invalido'), v.maxLength(500)),
    currency: v.pipe(v.string(), v.nonEmpty('Campo es requerido'), v.maxLength(5)),
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
      if (!input.arrival_date || !input.departure_date) {
        return true
      }

      return dayjs(input.arrival_date).isBefore(input.departure_date)
    }, (_) => "Fecha de regreso debe ser posterior a la fecha de llegada"),
    ['departure_date']
  ),



  v.forward(
    v.check((input) => {
      if (input.event_type === EventType.DAYS.toString()) {
        return input.event_days.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos un dia"),
    ['event_days']
  ),

  v.forward(
    v.check((input) => {
      if (input.event_type === EventType.SESSIONS.toString()) {
        return input.event_sessions.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos un dia"),
    ['event_sessions']
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
      if (input.event_type === EventType.DAYS.toString()) {
        return input.event_days.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos un dia"),
    ['event_days']
  ),

  v.forward(
    v.check((input) => {
      if (input.event_type === EventType.SESSIONS.toString()) {
        return input.event_sessions.length > 0
      }
      return true
    }, (_) => "Debe seleccionar al menos un dia"),
    ['event_sessions']
  )
);

export function getSchema(typ: string) {
  switch (typ) {
    case 'TALK': return talkSchema;
    case 'COURSE': return courseSchema;
    case 'SPECIAL': return specialSchema;
    default: return talkSchema;
  }
}

export type FormSchema = v.InferInput<ReturnType<typeof getSchema>>;
