import { AddonType, Currency, EventType, MealType, Method, OrderStatus, request } from "../../utils"
import { FormInfoResponse } from "./types"

export type SubmissionRequest = {
	submission_id?: string,
	first_name: string,
	last_name: string,
	email: string,
	id_type: string,
	id_value: string,
	country_code: string,
	phone: string,
	selected_addons: string[],

	meal_type: MealType,
	event_type: EventType,
	currency: Currency,

	arrival_date?: string,
	departure_date?: string,
	medical_insurance?: string,

	emergency_contact_full_name?: string,
	emergency_contact_email?: string,
	emergency_contact_country_code?: string,
	emergency_contact_phone?: string,
}

export type SubmissionResponse = {
	submission_id: string,
	order_id: string,
}

export async function submissionRequest(data: SubmissionRequest): Promise<SubmissionResponse> {
	const res = await request<SubmissionResponse>("submit", Method.POST, undefined, data)
	return res
}

export type FormSubmissionResponse = {
	submission: {
		id: string,
		form_id: string,
		first_name: string,
		last_name: string,
		email: string,
		id_type: string,
		id_value: string,
		country_code: string,
		phone: string,

		arrival_date?: string,
		departure_date?: string,
		medical_insurance?: string,

		emergency_contact_full_name?: string,
		emergency_contact_email?: string,
		emergency_contact_country_code?: string,
		emergency_contact_phone?: string,
	},
	order: {
		id: string,
		form_id: string,
		submission_id: string,
		status: OrderStatus,
		amount: string | number,
		currency: Currency,
		event_type: EventType,
		meal_type: MealType,
	},
	order_items: {
		id: string,
		order_id: string,
		addon_id: string,
		title: string,
		addon_type: AddonType,
		price: string | number,
		currency: Currency,
		date_time?: string
	}[],
}

export async function getFormSubmission(submission_id: string): Promise<FormSubmissionResponse> {
	const res = await request<FormSubmissionResponse>("form_submission", Method.GET, { submission_id });
	return res
}

export async function getFormInfo(): Promise<FormInfoResponse> {
	const res = await request<FormInfoResponse>("form_info", Method.GET)
	return res
}
