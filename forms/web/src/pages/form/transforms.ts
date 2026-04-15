import {
	AddonType,
	Currency,
	CurrencyMap,
	EventType,
	EventTypeValueMap,
	getDateForDatePicker,
	getDateList,
	getDateMap,
	getDateTimeForBackEnd,
	getMoneyDisplay,
	IdType,
	IdTypeValueMap,
	MealType,
	MealTypeValueMap
} from "../../utils"
import { FormSubmissionResponse, SubmissionRequest } from "./requests"
import { SubmissionSchema } from "./schema"
import { AddonListsObj, FormInfoResponse } from "./types"
import countryCodes from "./country_codes.json"

export const countryCodesList = countryCodes
	.map(item => ({ label: `(${item.dial_code}) ${item.name}`, value: item.dial_code }))

export const idTypesList = Object.values(IdType)
	.map(item => ({ label: IdTypeValueMap[item], value: item }))

export const mealTypesList = Object.values(MealType)
	.map(item => ({ label: MealTypeValueMap[item], value: item }))

export const eventTypesList = Object.values(EventType)
	.map(item => ({ label: EventTypeValueMap[item], value: item }))

export const currencyTypesList = Object.values(Currency)
	.map(item => ({ label: CurrencyMap[item], value: item }))

export const transformMeals = (addons: FormInfoResponse['addons']) => {
	return addons.map(item => ({
		title: getMoneyDisplay(item.currency, Number(item.price)),
		subtitle: item.title,
		value: item.id,
		hint: item.hint,
	}))
}

export const transformSessions = (addons: FormInfoResponse['addons']) => {
	return addons.map(item => ({
		title: `${getDateList(item.date_time)} | ${getMoneyDisplay(item.currency, Number(item.price))}`,
		subtitle: item.title,
		value: item.id,
		hint: item.hint,
	}))
}
export const transformToDayMap = (addons: FormInfoResponse['addons']) => {
	return addons.reduce((prev, cur) => {
		const key = getDateMap(cur.date_time);

		if (prev[key]) {
			prev[key].sessions.push(cur.id);
			prev[key].price += Number(cur.price)
		} else {
			prev[key] = {
				label: key,
				sessions: [cur.id],
				price: Number(cur.price),
			};
		}
		return prev;
	}, {} as AddonListsObj['daysMap'])
}

export const transformDaysMap = (daysMap: AddonListsObj['daysMap'], currency: Currency) => {
	return Object.values(daysMap).map(item => ({
		title: getMoneyDisplay(currency, item.price),
		subtitle: `${item.label} | ${item.sessions.length} sesion${item.sessions.length > 1 ? "es" : ""}`,
		value: item.label,
	}))
}

export const transformAddonsList = (
	addons: FormInfoResponse['addons'],
	currency: Currency
): AddonListsObj => {
	const out: AddonListsObj = { sessions: [], days: [], meals: [], daysMap: {} }

	const meals = []
	const sessions = []

	for (const addon of addons) {
		if (addon.currency !== currency) {
			continue
		}

		if (addon.addon_type === AddonType.SESSION) {
			sessions.push(addon)
		}

		if (addon.addon_type === AddonType.MEAL) {
			meals.push(addon)
		}
	}

	out.meals = transformMeals(meals)
	out.sessions = transformSessions(sessions)
	out.daysMap = transformToDayMap(sessions)
	out.days = transformDaysMap(out.daysMap, currency)

	return out
}


export function transformSubmissionResponseToSchema(res: FormSubmissionResponse): SubmissionSchema {
	return {
		first_name: res.submission.first_name,
		last_name: res.submission.last_name,
		email: res.submission.email,
		country_code: res.submission.country_code,
		phone: res.submission.phone,
		id_type: res.submission.id_type,
		id_value: res.submission.id_value,

		currency: res.order.currency,
		meal_type: res.order.meal_type,

		selected_meals: res.order_items
			.filter(item => item.addon_type === AddonType.MEAL)
			.map(item => item.addon_id),

		event_type: res.order.event_type,

		selected_sessions: res.order_items
			.filter(item => item.addon_type === AddonType.SESSION)
			.map(item => item.addon_id),

		selected_days: Array.from(new Set(
			res.order_items
				.filter(item => item.addon_type === AddonType.SESSION)
				.map(item => getDateMap(item.date_time)),
		)),

		arrival_date: res.submission.arrival_date ?
			getDateForDatePicker(res.submission.arrival_date) :
			undefined,
		departure_date: res.submission.departure_date ?
			getDateForDatePicker(res.submission.departure_date) :
			undefined,
		medical_insurance: res.submission.medical_insurance,

		emergency_contact_name: res.submission.emergency_contact_full_name,
		emergency_contact_country_code: res.submission.emergency_contact_country_code,
		emergency_contact_phone: res.submission.emergency_contact_phone,
		emergency_contact_email: res.submission.emergency_contact_email,
	}
}

export function transformSubmissionSchemaToRequest(values: SubmissionSchema, addons: string[], submission_id?: string): SubmissionRequest {
	return {
		submission_id: submission_id,

		first_name: values.first_name,
		last_name: values.last_name,
		email: values.email.toLowerCase(),
		id_type: values.id_type,
		id_value: values.id_value.toUpperCase(),
		country_code: values.country_code,
		phone: values.phone,
		selected_addons: addons,
		meal_type: values.meal_type || MealType.REGULAR,
		event_type: values.event_type || EventType.ALL_SESSIONS,
		currency: values.currency || Currency.PEN,

		arrival_date: values.arrival_date ?
			getDateTimeForBackEnd(values.arrival_date) :
			undefined,
		departure_date: values.departure_date ?
			getDateTimeForBackEnd(values.departure_date) :
			undefined,
		medical_insurance: values.medical_insurance,

		emergency_contact_full_name: values.emergency_contact_name,
		emergency_contact_email: values.emergency_contact_email?.toLowerCase(),
		emergency_contact_country_code: values.emergency_contact_country_code,
		emergency_contact_phone: values.emergency_contact_phone,
	}
}
