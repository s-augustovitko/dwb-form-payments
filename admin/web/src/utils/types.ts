import { SelectItem } from "../components"

export enum AddonType {
  SESSION = "SESSION",
  MEAL = "MEAL",
  ALL_SESSIONS_DISCOUNT = "ALL_SESSIONS_DISCOUNT",
  EARLY_DISCOUNT = "EARLY_DISCOUNT"
}

export const addonTypeMap = {
  [AddonType.SESSION]: "Session",
  [AddonType.MEAL]: "Meal",
  [AddonType.ALL_SESSIONS_DISCOUNT]: "Full Course Discount",
  [AddonType.EARLY_DISCOUNT]: "Early Bird Discount"
}

export enum Currency {
  PEN = "PEN",
  USD = "USD",
}

export const currencyMap = {
  [Currency.PEN]: "Soles (S/)",
  [Currency.USD]: "Dollars ($)"
}

export const currencyListItems: SelectItem[] = Object.values(Currency)
  .map(item => ({ label: currencyMap[item], value: item }))

export enum OrderStatus {
  DRAFT = "DRAFT",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  ON_SITE = "ON_SITE"
}

export const orderStatusMap = {
  [OrderStatus.DRAFT]: "Draft",
  [OrderStatus.CONFIRMED]: "Confirmed",
  [OrderStatus.CANCELLED]: "Cancelled",
  [OrderStatus.ON_SITE]: "On Site Payment"
}

export enum FormType {
  CONFERENCE = "CONFERENCE",
  COURSE = "COURSE",
  SPECIAL = "SPECIAL",
}

export const formTypeMap = {
  [FormType.CONFERENCE]: "Conference",
  [FormType.COURSE]: "Course",
  [FormType.SPECIAL]: "Special Course",
}


