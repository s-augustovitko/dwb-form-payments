import dayjs from "dayjs"
import { getDateDisplay } from "./dates"
import { EventType, IdType, IdTypeValueMap } from "../pages/form/types"
import { ValidationFn } from "./form"

export function minLength<T>(min: number): ValidationFn<string | T[]> {
  return (value: string | T[] = "") => {
    if (value?.length < min) {
      return `Debe tener al menos ${min} caracteres`
    }
  }
}

export function maxLength<T>(max: number): ValidationFn<string | T[]> {
  return (value: string | T[] = "") => {
    if (!value) return
    if (value?.length > max) {
      return `Debe tener menos de ${max} caracteres`
    }
  }
}

export function minWords(min: number): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    const words = value.trim().split(/\s+/).filter(Boolean)
    if (words.length < min) {
      return `Debe tener al menos ${min} palabras`
    }
  }
}

const wordCharsRegex = new RegExp(/^[\p{L}\s\-'.]+$/u)
export function wordChars(): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    return wordCharsRegex.test(value) ? undefined : "El campo tiene caracteres invalidos"
  }
}

const emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
export function emailValidate(): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    if (!emailRegex.test(value)) {
      return "Correo invalido"
    }
  }
}

const phoneRegex = new RegExp(/^[0-9]+$/)
export function phoneValidate(): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    if (!phoneRegex.test(value)) {
      return "Telefono solo debe contener numeros"
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
        return `La fecha no puede ser anterior a ${getDateDisplay(min)}`;
      }
      return undefined
    } catch (_) {
      return "Fecha invalida"
    }
  }
}

export function notAfterDate(maxDate: Date | string): ValidationFn<Date | string> {
  const max = dayjs(maxDate).endOf("d")

  return (value: Date | string) => {
    if (!value) return;

    try {
      if (dayjs(value).isAfter(max)) {
        return `La fecha no puede ser posterior a ${getDateDisplay(max)}`;
      }
      return undefined
    } catch (_) {
      return "Fecha invalida"
    }
  }
}

const dniPattern = new RegExp(/^[0-9]{8}$/)
const otherIDPattern = new RegExp(/^[a-zA-Z0-9]{6,12}$/)
export function idValidate(id_type: string): ValidationFn<string> {
  return (value: string): string | undefined => {
    if (id_type === IdType.DNI) {
      return dniPattern.test(value) ? undefined : "DNI invalido"
    } else {
      return otherIDPattern.test(value) ? undefined : (IdTypeValueMap[id_type as IdType] || "Documento") + " invalido"
    }
  }
}

export function eventDaysValidate(event_type: string): ValidationFn<string[]> {
  return (value: string[]): string | undefined => {
    if (event_type !== EventType.DAYS) return

    if (value.length < 1) {
      return "Debe seleccionar al menos un dia"
    }
  }
}

export function eventSessionsValidate(event_type: string): ValidationFn<string[]> {
  return (value: string[]): string | undefined => {
    if (event_type !== EventType.SESSIONS) return

    if (value.length < 1) {
      return "Debe seleccionar al menos una sesion"
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
      return "Campo es requerido"
    }
  }
}

export function minValue(min: number): ValidationFn<number> {
  return (value: number) => {
    if (value < min) {
      return `Debe ser mayor o igual a ${min}`
    }
  }
}
