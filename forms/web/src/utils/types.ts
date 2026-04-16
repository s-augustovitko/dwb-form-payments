export enum FormType {
  CONFERENCE = 'CONFERENCE',
  COURSE = 'COURSE',
  SPECIAL = 'SPECIAL',
}

export enum AddonType {
  SESSION = "SESSION",
  MEAL = "MEAL",
  ALL_SESSIONS_DISCOUNT = "ALL_SESSIONS_DISCOUNT",
  EARLY_DISCOUNT = "EARLY_DISCOUNT"
}

export const AddonTypeMap = {
  [AddonType.SESSION]: "Sesion",
  [AddonType.MEAL]: "Comida",
  [AddonType.ALL_SESSIONS_DISCOUNT]: "Descuento de Curso Completo",
  [AddonType.EARLY_DISCOUNT]: "Descuento de Pre-Venta"
}

export enum Currency {
  PEN = "PEN",
  USD = "USD",
}

export const CurrencyMap = {
  [Currency.PEN]: "Soles (S/)",
  [Currency.USD]: "Dolares ($)"
}

export enum EventType {
  ALL_SESSIONS = "ALL_SESSIONS",
  PER_DAY = "PER_DAY",
  PER_SESSION = "PER_SESSION",
}

export const EventTypeValueMap = {
  [EventType.PER_SESSION]: "Por Sesiones y Conferencias",
  [EventType.PER_DAY]: "Por Dias",
  [EventType.ALL_SESSIONS]: "Curso Completo",
}

export enum IdType {
  DNI = "DNI",
  CE = "CE",
  PASSPORT = "PASSPORT",
}

export const IdTypeValueMap = {
  [IdType.DNI]: "DNI",
  [IdType.CE]: "CE",
  [IdType.PASSPORT]: "Pasaporte",
}

export enum MealType {
  REGULAR = "REGULAR",
  VEGETARIAN = "VEGETARIAN",
  NONE = "NONE",
}

export const MealTypeValueMap = {
  [MealType.REGULAR]: "Regular",
  [MealType.VEGETARIAN]: "Vegetariano",
  [MealType.NONE]: "Sin Comidas",
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ON_SITE = 'ON_SITE',
}

export const OrderStatusMap = {
  [OrderStatus.CONFIRMED]: 'Confirmado',
  [OrderStatus.DRAFT]: 'No Completado',
  [OrderStatus.ON_SITE]: 'Pago en evento',
  [OrderStatus.CANCELLED]: 'Cancelado',
}
