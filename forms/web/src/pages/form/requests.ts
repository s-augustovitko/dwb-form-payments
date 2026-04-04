import { Method, request } from "../../utils";

export interface FormRequestSchema {
  form_id?: string;
  settings_id: string;

  first_name: string;
  last_name: string;
  email: string;
  country_code: string;
  phone: string;
  id_type: string;
  id_value: string;

  meal_type: string;
  meals_count: number;

  event_type: string;
  sessions_count: number;

  arrival_date?: string;
  departure_date?: string;

  medical_insurance?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_country_code?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;

  // Payment
  currency: string;
}

type FormResponseSchema = {
  order_id: string;
  form_id: string;
}

export async function submitFormRequest(data: FormRequestSchema): Promise<FormResponseSchema> {
  try {
    const res = await request<FormResponseSchema>("submit", Method.POST, undefined, data)
    return res
  } catch (err) {
    throw err
  }
}

export type UpdatePaymentInfoRequest = {
  form_id: string;
  token: string;
}

export type UpdatePaymentInfoResponse = {
  payment_id: string;
  payment_status: string
}

export async function updatePaymentInfo(data: UpdatePaymentInfoRequest): Promise<UpdatePaymentInfoResponse> {
  try {
    const res = await request<UpdatePaymentInfoResponse>("payment", Method.POST, undefined, data)
    return res
  } catch (err) {
    throw err
  }
}

