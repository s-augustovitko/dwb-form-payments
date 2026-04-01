import * as v from 'valibot';
import dayjs from 'dayjs';
import { SelectItem } from "../../components";

export const settingTypes: SelectItem[] = [
  { label: "Talk", value: "TALK" },
  { label: "Course", value: "COURSE" },
  { label: "Special Course", value: "SPECIAL" },
];

const numCheck = (v: string) => {
  if (!v) {
    return true
  }

  const val = Number(v)
  if (Number.isNaN(val)) {
    return false
  }

  return val >= 0
}

const decimalCheck = (v: string) => {
  if (!v) {
    return true
  }

  if (v.includes('.')) {
    return (v.split('.').at(1)?.length || 0) <= 2;
  }
  return true;
}


export const settingSchema = v.pipe(
  v.object({
    form_type: v.pipe(
      v.string('Required field'),
      v.nonEmpty('Please select a type'),
      v.maxLength(20, 'Type too long')
    ),
    title: v.pipe(
      v.string('Required field'),
      v.nonEmpty('Title is required'),
      v.minLength(3, 'Title must be at least 3 characters'),
      v.maxLength(255, 'Title cannot exceed 255 characters')
    ),
    description: v.optional(
      v.pipe(
        v.string('Must be a string'),
        v.maxLength(2000, 'Description cannot exceed 2000 characters')
      ),
      ""
    ),
    start_date: v.pipe(
      v.string('Required field'),
      v.nonEmpty('Start date is required'),
      v.check((val) => {
        if (!val) return true;
        return dayjs(val).isValid();
      }, 'Invalid date format'),
      v.check((val) => {
        if (!val) return true;
        const today = dayjs().startOf('d');
        return !dayjs(val).isBefore(today);
      }, 'Date cannot be before today')
    ),
    end_date: v.pipe(
      v.string('Required field'),
      v.nonEmpty('End date is required'),
      v.check((val) => {
        if (!val) return true;
        return dayjs(val).isValid();
      }, 'Invalid date format'),
      v.check((val) => {
        if (!val) return true;
        const tomorrow = dayjs().add(1, 'd').startOf('d');
        return !dayjs(val).isBefore(tomorrow);
      }, 'Date should not be before tomorrow')
    ),
    meal_price_pen: v.optional(
      v.pipe(
        v.string(),
        v.check(numCheck, "Must be a positive number"),
        v.check(decimalCheck, "Should not have more than 2 decimals")
      ),
      "0"
    ),
    meal_price_usd: v.optional(
      v.pipe(
        v.string(),
        v.check(numCheck, "Must be a positive number"),
        v.check(decimalCheck, "Should not have more than 2 decimals"),
      ),
      "0"
    ),
    session_price_pen: v.optional(
      v.pipe(
        v.string(),
        v.check(numCheck, "Must be a positive number"),
        v.check(decimalCheck, "Should not have more than 2 decimals"),
      ),
      "0"
    ),
    session_price_usd: v.optional(
      v.pipe(
        v.string(),
        v.check(numCheck, "Must be a positive number"),
        v.check(decimalCheck, "Should not have more than 2 decimals"),
      ),
      "0"
    ),
    sessions: v.pipe(
      v.array(
        v.object({
          id: v.optional(v.string(), ""),
          title: v.pipe(
            v.string('Required field'),
            v.nonEmpty('Session title is required'),
            v.minLength(3, 'Title must be at least 3 characters'),
            v.maxLength(255, 'Title cannot exceed 255 characters')
          ),
          session_time: v.pipe(
            v.string('Required field'),
            v.nonEmpty('Session time is required'),
            v.check((val) => {
              if (!val) return true;
              return dayjs(val).isValid();
            }, 'Invalid date/time format')
          )
        })
      ),
      v.minLength(1, 'At least one session is required')
    ),
    meals: v.optional(
      v.array(
        v.object({
          id: v.optional(v.string(), ""),
          title: v.pipe(
            v.string('Required field'),
            v.nonEmpty('Meal title is required'),
            v.minLength(3, 'Title must be at least 3 characters'),
            v.maxLength(255, 'Title cannot exceed 255 characters')
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
    }, "End date cannot be earlier than start date"),
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
    }, "Session times must fall within the start and end date range"),
    ['sessions']
  )
);

export type SettingSchema = v.InferInput<typeof settingSchema>;
