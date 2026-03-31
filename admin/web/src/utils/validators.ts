import dayjs from "dayjs"
import { getDateDisplay } from "./dates"
import { ValidationFn } from "./form"

export function minLength<T>(min: number): ValidationFn<string | T[]> {
  return (value: string | T[] = "") => {
    if (value?.length < min) {
      return `Should be at least ${min} characters`
    }
  }
}

export function maxLength<T>(max: number): ValidationFn<string | T[]> {
  return (value: string | T[] = "") => {
    if (!value) return
    if (value?.length > max) {
      return `Should be at most ${max} characters`
    }
  }
}

export function minWords(min: number): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    const words = value.trim().split(/\s+/).filter(Boolean)
    if (words.length < min) {
      return `Should be at least ${min} words`
    }
  }
}

const wordCharsRegex = new RegExp(/^[\p{L}\s\-'.]+$/u)
export function wordChars(): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    return wordCharsRegex.test(value) ? undefined : "Field has invalid characters"
  }
}

const emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
export function emailValidate(): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    if (!emailRegex.test(value)) {
      return "Invalid email"
    }
  }
}

const phoneRegex = new RegExp(/^[0-9]+$/)
export function phoneValidate(): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    if (!phoneRegex.test(value)) {
      return "Phone must only contain numbers"
    }
  }
}

export function validator<T>(validators: ValidationFn<T>[]): ValidationFn<T> {
  return (value: T) => {
    for (const validate of validators) {
      const error = validate(value)
      if (error) return error
    }
  }
}

export function notBeforeDate(minDate: Date | string): ValidationFn<Date | string> {
  const min = dayjs(minDate).startOf("d")

  return (value: Date | string) => {
    if (!value) return;

    try {
      if (dayjs(value).isBefore(min)) {
        return `Date should not be before ${getDateDisplay(min)}`;
      }
      return undefined
    } catch (_) {
      return "Invalid date"
    }
  }
}

export function notAfterDate(maxDate: Date | string): ValidationFn<Date | string> {
  const max = dayjs(maxDate).endOf("d")

  return (value: Date | string) => {
    if (!value) return;

    try {
      if (dayjs(value).isAfter(max)) {
        return `Date should not be after ${getDateDisplay(max)}`;
      }
      return undefined
    } catch (_) {
      return "Invalid date"
    }
  }
}

export function required<T>(): ValidationFn<T> {
  return (value: T) => {
    if (
      value == null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return "Required field"
    }
  }
}

export function minValue(min: number): ValidationFn<number> {
  return (value: number) => {
    if (value < min) {
      return `Should be greater or equal to ${min}`
    }
  }
}
