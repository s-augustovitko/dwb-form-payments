import countryCodes from "./countryCodes.json"
import { Currency, CurrencyValueMap, EventType, EventTypeValueMap, IdType, IdTypeValueMap, MealType, MealTypeValueMap } from "./enums"

export const countryCodesList = countryCodes.map(item => ({ label: `(${item.dial_code}) ${item.name}`, value: item.dial_code }))
export const idTypesList = Object.values(IdType).map(item => ({ label: IdTypeValueMap[item], value: item }))
export const mealTypesList = Object.values(MealType).map(item => ({ label: MealTypeValueMap[item], value: item }))
export const eventTypesList = Object.values(EventType).map(item => ({ label: EventTypeValueMap[item], value: item }))
export const currencyTypesList = Object.values(Currency).map(item => ({ label: CurrencyValueMap[item], value: item }))


