import { Method, request } from "../../utils"
import { UpdatePaymentRequest, UpdatePaymentResponse } from "./types"

export async function updatePayment(data: UpdatePaymentRequest): Promise<UpdatePaymentResponse> {
	const res = await request<UpdatePaymentResponse>("payment", Method.POST, undefined, data)
	return res
}
