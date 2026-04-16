export enum PaymentType {
	CULQI = "CULQI",
	ON_SITE = "ON_SITE",
}

export type UpdatePaymentRequest = {
	payment_type: PaymentType,
	submission_id: string,
	culqi_token?: string
}
export type UpdatePaymentResponse = {
	payment_id: string,
	submission_id: string,
	order_id: string,
}
