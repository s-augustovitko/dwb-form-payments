import { SelectItem } from "../../components"
import { fields, maxLength, minLength, minValue, notBeforeDate, required } from "../../utils"

export const settingsTypes: SelectItem[] = [
  { label: "Charla", value: "TALK" },
  { label: "Curso", value: "COURSE" },
  { label: "Curso Especial", value: "SPECIAL" },
]

export type SessionValues = {
  title: string
  session_time: string
}

export type MealValues = {
  title: string
}

export type SettingsValues = {
  form_type: string
  title: string
  description: string
  start_date: string
  end_date: string
  meal_price_pen: number
  meal_price_usd: number
  session_price_pen: number
  session_price_usd: number
  sessions: SessionValues[]
  meals: MealValues[]
}

export const settingsDataSchema = (initial?: Partial<SettingsValues>) => ({
  form_type: fields.string([
    required(),
    minLength(1),
    maxLength(20)
  ], initial?.form_type ?? "TALK"),

  title: fields.string([
    required(),
    minLength(3),
    maxLength(255)
  ], initial?.title ?? ""),

  description: fields.string([
    maxLength(2000)
  ], initial?.description ?? ""),

  start_date: fields.string([
    required(),
    notBeforeDate(new Date())
  ], initial?.start_date ?? ""),

  end_date: fields.string([
    required(),
    notBeforeDate(new Date())
  ], initial?.end_date ?? ""),

  meal_price_pen: fields.number([
    minValue(0),
  ], initial?.meal_price_pen ?? 0),

  meal_price_usd: fields.number([
    minValue(0),
  ], initial?.meal_price_usd ?? 0),

  session_price_pen: fields.number([
    minValue(0),
  ], initial?.session_price_pen ?? 0),

  session_price_usd: fields.number([
    minValue(0),
  ], initial?.session_price_usd ?? 0),


  sessions: fields.formArray(
    {
      title: fields.string([
        required(),
        minLength(3),
        maxLength(255)
      ]),

      session_time: fields.string([
        required(),
        notBeforeDate(new Date())
      ])
    },
    [required(), minLength(1)],
    initial?.sessions ?? [],
  ),

  meals: fields.formArray(
    {
      title: fields.string([
        required(),
        minLength(1),
        maxLength(255)
      ])
    },
    [],
    initial?.meals ?? [],
  )
})

export type SettingsUpdateValues = {
  form_type: string
  title: string
  description: string
  start_date: string
  end_date: string
  meal_price_pen: number
  meal_price_usd: number
  session_price_pen: number
  session_price_usd: number
}

export const settingsUpdateSchema = (initial: Partial<SettingsUpdateValues>) => ({
  form_type: fields.string([
    required(),
    minLength(1),
    maxLength(20)
  ], initial?.form_type ?? "TALK"),

  title: fields.string([
    required(),
    minLength(3),
    maxLength(255)
  ], initial?.title ?? ""),

  description: fields.string([
    maxLength(2000)
  ], initial?.description ?? ""),

  start_date: fields.string([
    required(),
    notBeforeDate(new Date())
  ], initial?.start_date ?? ""),

  end_date: fields.string([
    required(),
    notBeforeDate(new Date())
  ], initial?.end_date ?? ""),

  meal_price_pen: fields.number([
    minValue(0),
  ], initial?.meal_price_pen ?? 0),

  meal_price_usd: fields.number([
    minValue(0),
  ], initial?.meal_price_usd ?? 0),

  session_price_pen: fields.number([
    minValue(0),
  ], initial?.session_price_pen ?? 0),

  session_price_usd: fields.number([
    minValue(0),
  ], initial?.session_price_usd ?? 0),
})
