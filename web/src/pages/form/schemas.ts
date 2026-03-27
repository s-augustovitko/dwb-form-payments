import { emailValidate, fields, maxLength, minLength, notAfterDate, notBeforeDate, phoneValidate, required } from "../../utils";
import { Currency, FormType } from "./types";

export type SchemaValues = {
  first_name: string;
  last_name: string;
  email: string;
  country_code: string;
  phone: string;
  id_type: string;
  id_value: string;

  meal_type?: string
  event_meals?: string[]

  event_type?: string,
  event_sessions?: string[],
  event_days?: string[]

  arrival_date?: string
  departure_date?: string

  medical_insurance?: string

  emergency_contact_name?: string
  emergency_contact_country_code?: string
  emergency_contact_phone?: string
  emergency_contact_email?: string

  currency?: string
}

const emptyEvents = {
  meal_type: fields.string([], "REGULAR"),
  event_meals: fields.stringArray([]),
  event_type: fields.string([], "FULL"),
  event_sessions: fields.stringArray([]),
  event_days: fields.stringArray([]),
}

const emptySpecial = {
  arrival_date: fields.string([]),
  departure_date: fields.string([]),
  medical_insurance: fields.string([]),
  emergency_contact_name: fields.string([]),
  emergency_contact_country_code: fields.string([], "+51"),
  emergency_contact_phone: fields.string([]),
  emergency_contact_email: fields.string([]),
  currency: fields.string([], Currency.PEN.toString())
}

const fullEvents = {
  meal_type: fields.string([
    required(),
    maxLength(10)
  ], "REGULAR"),
  event_meals: fields.stringArray([maxLength(64)]),

  event_type: fields.string([
    required(),
    maxLength(10)
  ], "FULL"),

  event_sessions: fields.stringArray([maxLength(64)]),
  event_days: fields.stringArray([maxLength(64)]),
}


const talkSchema = {
  first_name: fields.string([required(), maxLength(250)], ""),
  last_name: fields.string([required(), maxLength(250)], ""),

  email: fields.string([required(), emailValidate(), maxLength(500)], ""),

  country_code: fields.string([required(), maxLength(64)], "+51"),
  phone: fields.string([required(), phoneValidate(), minLength(3), maxLength(17)], ""),

  id_type: fields.string([required(), maxLength(10)], "DNI"),
  id_value: fields.string([required(), minLength(3), maxLength(12)], ""),

  ...emptyEvents,
  ...emptySpecial
}

const courseSchema = {
  ...talkSchema,
  ...fullEvents,
  ...emptySpecial
}

const specialSchema = {
  ...talkSchema,
  ...fullEvents,

  arrival_date: fields.string([
    notBeforeDate(new Date(new Date().setMonth(new Date().getMonth() - 3))),
    notAfterDate(new Date(new Date().setMonth(new Date().getMonth() + 3)))
  ]),

  departure_date: fields.string([
    notBeforeDate(new Date()),
    notAfterDate(new Date(new Date().setMonth(new Date().getMonth() + 3)))
  ]),

  medical_insurance: fields.string([
    maxLength(64)
  ]),

  emergency_contact_name: fields.string([
    required(),
    maxLength(500)
  ]),

  emergency_contact_country_code: fields.string([
    required(),
    maxLength(5)
  ], "+51"),

  emergency_contact_phone: fields.string([
    required(),
    phoneValidate(),
    minLength(3),
    maxLength(17)
  ]),

  emergency_contact_email: fields.string([
    emailValidate(),
    maxLength(500)
  ]),

  currency: fields.string([
    required(),
    maxLength(5)
  ], Currency.PEN.toString())
}

export function getSchema(typ: FormType) {
  switch (typ) {
    case FormType.TALK:
      return talkSchema;
    case FormType.COURSE:
      return courseSchema;
    case FormType.SPECIAL:
      return specialSchema;
    default:
      return talkSchema;
  }
}
