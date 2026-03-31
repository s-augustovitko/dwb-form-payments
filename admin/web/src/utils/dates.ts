import dayjs from "dayjs";

dayjs.locale("en");

type AnyDate = Date | dayjs.Dayjs | string

export function normalizeDate(date?: AnyDate) {
	if (!date) return undefined;

	if (typeof date === "string") {
		const hasTimezone = new RegExp(/([Zz]|[+-]\d{2}:?\d{2})$/).test(date);
		date = hasTimezone ? date : `${date}Z`;
	}

	return date;
}

export function getDateForDateTimePicker(date?: AnyDate) {
	return dayjs(normalizeDate(date)).format("YYYY-MM-DD[T]HH:mm");
}

export function getDateTimeForBackEnd(date?: AnyDate) {
	return dayjs(normalizeDate(date)).format("YYYY-MM-DD[T]HH:mm:ssZ");
}

export function getDateForDatePicker(date?: AnyDate) {
	return dayjs(normalizeDate(date)).format("YYYY-MM-DD");
}

export function getDateDisplay(date?: AnyDate) {
	return dayjs(normalizeDate(date)).format("ddd[,] MMM D");
}

export function getDateList(date?: AnyDate) {
	return dayjs(normalizeDate(date)).format("dddd D | h:mm a");
}

export function getDateMap(date?: AnyDate) {
	return dayjs(normalizeDate(date)).format("dddd D");
}

export function getMoneyDisplay(currency: string = "PEN", amount: number = 0): string {
	const formatter = new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency: currency,
	});

	return formatter.format(amount);
}
