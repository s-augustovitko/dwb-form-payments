import moment from "moment"
import { getDateDisplay } from "./dates"
import { EventType, IdType, IdTypeValueMap } from "../pages/form/types"
import { ValidationFn } from "./form"

export function minLength<T>(min: number): ValidationFn<string | T[]> {
  return (value: string | T[] = "") => {
    if (value?.length < min) {
      return `Debe tener almenos ${min} caracteres`
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
    if (value?.trim()?.split(" ")?.length < min) {
      return `Debe tener almenos ${min} palabras`
    }
  }
}


const emailRegex = new RegExp("^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$")
export function emailValidate(): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    if (!emailRegex.test(value)) {
      return "Correo invalido"
    }
  }
}

const phoneRegex = new RegExp("^[0-9\ ]+$")
export function phoneValidate(): ValidationFn<string> {
  return (value: string = "") => {
    if (!value) return
    if (!phoneRegex.test(value)) {
      return "Telefono solo debe contener numeros y espacios"
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
  const min = moment(minDate).startOf("d")

  return (value: Date | string) => {
    if (!value) return;

    try {
      if (moment(value).isBefore(min)) {
        return `La fecha no puede ser anterior a ${getDateDisplay(min)}`;
      }
      return undefined
    } catch (_) {
      return "Fecha invalida"
    }
  }
}

export function notAfterDate(maxDate: Date | string): ValidationFn<Date | string> {
  const max = moment(maxDate).endOf("d")

  return (value: Date | string) => {
    if (!value) return;

    try {
      if (moment(value).isAfter(max)) {
        return `La fecha no puede ser posterior a ${getDateDisplay(max)}`;
      }
      return undefined
    } catch (_) {
      return "Fecha invalida"
    }
  }
}

export function idValidate(id_type: string): ValidationFn<string> {
  return (value: string): string | undefined => {
    if (id_type === IdType.DNI) {
      return new RegExp("^\\d{8}$").test(value) ? undefined : "DNI invalido"
    } else {
      return new RegExp("^[a-zA-Z0-9]{6,12}$").test(value) ? undefined : (IdTypeValueMap[id_type as IdType] || "Documento") + " invalido"
    }
  }
}

export function eventDaysValidate(event_type: string): ValidationFn<string[]> {
  return (value: string[]): string | undefined => {
    if (event_type !== EventType.DAYS) return

    if (value.length < 1) {
      return "Debe seleccionar almenos un dia"
    }
  }
}

export function eventSessionsValidate(event_type: string): ValidationFn<string[]> {
  return (value: string[]): string | undefined => {
    if (event_type !== EventType.SESSIONS) return

    if (value.length < 1) {
      return "Debe seleccionar almenos una sesion"
    }
  }
}

export function required<T>(): ValidationFn<T> {
  return (value: any) => {
    if (!value) return "Campo es requerido"
  }
}

export function minValue(min: number): ValidationFn<number> {
  return (value: number) => {
    if (value < min) {
      return `Debe ser mayor o igual a ${min}`
    }
  }
}
