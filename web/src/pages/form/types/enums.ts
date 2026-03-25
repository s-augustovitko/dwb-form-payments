export enum EventType {
  FULL = "FULL",
  DAYS = "DAYS",
  SESSIONS = "SESSIONS",
}
export const eventTypes = Object.values(EventType);

export const EventTypeValueMap = {
  [EventType.SESSIONS]: "Por Sesiones",
  [EventType.DAYS]: "Por Dias",
  [EventType.FULL]: "Curso Completo",
}

export enum IdType {
  DNI = "DNI",
  CE = "CE",
  PASSPORT = "PASSPORT",
}

export const idTypes = Object.values(IdType);

export const IdTypeValueMap = {
  [IdType.DNI]: "DNI",
  [IdType.CE]: "CE",
  [IdType.PASSPORT]: "Pasaporte",
}

export enum MealType {
  REGULAR = "REGULAR",
  VEGGIE = "VEGGIE",
}

export const mealTypes = Object.values(MealType);

export const MealTypeValueMap = {
  [MealType.REGULAR]: "Regular",
  [MealType.VEGGIE]: "Vegetariano",
};

export enum Currency {
  PEN = "PEN",
  USD = "USD",
}

export const currencies = Object.values(Currency);

export const CurrencyValueMap = {
  [Currency.PEN]: "Soles (PEN)",
  [Currency.USD]: "Dolares (USD)",
};
