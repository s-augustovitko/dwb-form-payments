import dayjs from "dayjs";
import * as v from "valibot";
import { AddonType, Currency, FormType } from "../../utils";

const addonSchema = v.object({
  id: v.optional(v.string()),
  addon_type: v.picklist(Object.values(AddonType), 'Invalid addon type'),
  title: v.pipe(
    v.string("Title must be a string"),
    v.minLength(3, "Title is too short (min 3)"),
    v.maxLength(255, "Title is too long (max 255)")
  ),
  price: v.pipe(
    v.number(),
    v.transform(Number),
    v.check((v) => !isNaN(Number(v)), "Price must be a valid number"),
    v.minValue(0, "Price cannot be negative"),
    v.check((val) => {
      const stringVal = val.toString();
      if (stringVal.includes('.')) {
        return stringVal.split('.')[1].length <= 2;
      }
      return true;
    }, "Price supports a maximum of 2 decimal places")
  ),
  currency: v.picklist(Object.values(Currency), "Currency must be PEN or USD"),
  hint: v.optional(v.pipe(v.string(), v.maxLength(255))),
  date_time: v.optional(v.pipe(
    v.string(),
    v.check((date) => dayjs(date).isValid(), "Invalid date format")
  )),
});

export const formSchema = v.pipe(
  v.object({
    form_type: v.picklist(
      Object.values(FormType),
      "Invalid form type"
    ),

    title: v.pipe(
      v.string(),
      v.minLength(3, "Title is too short"),
      v.maxLength(255, "Title is too long")
    ),

    description: v.optional(v.pipe(v.string(), v.maxLength(2000))),

    start_date: v.pipe(
      v.string(),
      v.check((date) => dayjs(date).isValid(), "Invalid date format"),
      v.check((date) => dayjs(date).isAfter(dayjs().subtract(1, 'd'), 'd'), "start_date must be in the future"),
      v.check((date) => dayjs(date).isBefore(dayjs().add(1, 'year')), "start_date must be in the less than 1 year in the future")
    ),

    end_date: v.pipe(
      v.string(),
      v.check((date) => dayjs(date).isValid(), "Invalid date format"),
      v.check((date) => dayjs(date).isBefore(dayjs().add(1, 'year')), "end_date must be in the less than 1 year in the future")
    ),

    sessions: v.pipe(
      v.array(addonSchema),
      v.minLength(1, "At least one addon is required")
    ),
    discounts: v.optional(v.array(addonSchema)),
    meals: v.optional(v.array(addonSchema)),
  }),

  v.forward(
    v.check(
      ({ sessions }) => sessions.every(s => !!s.date_time && dayjs(s.date_time).isValid()),
      "date_time is required for Sessions"
    ),
    ["sessions"]
  ),

  v.forward(
    v.check(
      ({ discounts = [] }) => discounts.every(d =>
        d.addon_type !== AddonType.EARLY_DISCOUNT || (!!d.date_time && dayjs(d.date_time).isValid())
      ),
      "date_time is required for Early Discounts"
    ),
    ["discounts"]
  ),

  v.forward(
    v.check(
      (input) => dayjs(input.end_date).isAfter(input.start_date, 'd') || dayjs(input.end_date).isSame(input.start_date, 'd'),
      "end_date must be after start_date"
    ),
    ["end_date"]
  ),

  v.forward(
    v.check((input) => {
      return input.sessions.every((session) => {
        const dt = dayjs(session.date_time);

        return (
          (dt.isAfter(input.start_date, 'd') || dt.isSame(input.start_date, 'd')) &&
          (dt.isBefore(input.end_date, 'd') || dt.isSame(input.end_date, 'd'))
        );
      });
    }, "Addon date_time must be between form start_date and end_date"),
    ["sessions"]
  ),
);

export type AddonItemFormData = v.InferOutput<typeof addonSchema>;
export type SessionItemFormData = v.InferOutput<typeof addonSchema>;
export type FormWithAddonsData = v.InferOutput<typeof formSchema>;
