import * as v from 'valibot';
import dayjs from 'dayjs';
import { SelectItem } from "../../components";

export const settingTypes: SelectItem[] = [
  { label: "Talk", value: "TALK" },
  { label: "Course", value: "COURSE" },
  { label: "Special Course", value: "SPECIAL" },
];

export const settingSchema = v.pipe(
  v.object({
    form_type: v.pipe(
      v.string(),
      v.nonEmpty(),
      v.maxLength(20)
    ),
    title: v.pipe(
      v.string(),
      v.nonEmpty(),
      v.minLength(3),
      v.maxLength(255)
    ),
    description: v.optional(
      v.pipe(
        v.string(),
        v.maxLength(2000)
      ),
      ""
    ),
    start_date: v.pipe(
      v.string(),
      v.nonEmpty(),
      v.check((val) => {
        if (!val) return true;
        return dayjs(val).isValid();
      }, 'Invalid Date'),
      v.check((val) => {
        if (!val) return true;
        const today = dayjs().startOf('d');
        return !dayjs(val).isBefore(today);
      }, 'Date cannot be before today')
    ),
    end_date: v.pipe(
      v.string(),
      v.nonEmpty('Campo es requerido'),
      v.check((val) => {
        if (!val) return true;
        return dayjs(val).isValid();
      }, 'Invalid date'),
      v.check((val) => {
        if (!val) return true;
        const tomorrow = dayjs().add(1, 'd').startOf('d');
        return !dayjs(val).isBefore(tomorrow);
      }, 'Date should not be before tomorrow')
    ),
    meal_price_pen: v.optional(
      v.pipe(
        v.number(),
        v.minValue(0)
      ),
      0
    ),
    meal_price_usd: v.optional(
      v.pipe(
        v.number(),
        v.minValue(0)
      ),
      0
    ),
    session_price_pen: v.optional(
      v.pipe(
        v.number(),
        v.minValue(0)
      ),
      0
    ),
    session_price_usd: v.optional(
      v.pipe(
        v.number(),
        v.minValue(0)
      ),
      0
    ),
    sessions: v.pipe(
      v.array(
        v.object({
          id: v.optional(v.string(), ""),
          title: v.pipe(
            v.string(),
            v.nonEmpty(),
            v.minLength(3),
            v.maxLength(255)
          ),
          session_time: v.pipe(
            v.string(),
            v.nonEmpty(),
            v.check((val) => {
              if (!val) return true;
              return dayjs(val).isValid();
            })
          )
        })
      ),
      v.minLength(1)
    ),
    meals: v.optional(
      v.array(
        v.object({
          id: v.optional(v.string(), ""),
          title: v.pipe(
            v.string(),
            v.nonEmpty(),
            v.minLength(3),
            v.maxLength(255)
          )
        })
      ),
      []
    )
  }),

  // Cross-field validation: End date not before Start date
  v.forward(
    v.check((input) => {
      if (!input.start_date || !input.end_date) return true;
      return !dayjs(input.end_date).isBefore(dayjs(input.start_date));
    }, "End date should not be before start date"),
    ['end_date']
  ),

  // Cross-field validation: Sessions inside start and end date range
  v.forward(
    v.check((input) => {
      if (!input.start_date || !input.end_date || !input.sessions) return true;

      const start = dayjs(input.start_date).startOf('d');
      const end = dayjs(input.end_date).endOf('d');

      return input.sessions.every(session => {
        if (!session.session_time) return true;

        const sTime = dayjs(session.session_time);
        return !sTime.isBefore(start) && !sTime.isAfter(end);
      });
    }, "Session times must not be outside of the start and end dates range"),
    ['sessions']
  )
);

export type SettingSchema = v.InferInput<typeof settingSchema>
