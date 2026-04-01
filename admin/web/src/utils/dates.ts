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

/**
 * Format a date into "YYYY-MM-DD[T]HH:mm" suitable for datetime-local inputs.
 *
 * @param date - The date to format (Date, dayjs.Dayjs, or ISO string). If omitted, the current date/time is used.
 * @returns A string formatted as `YYYY-MM-DD[T]HH:mm`
 */
export function getDateForDateTimePicker(date?: AnyDate) {
	return dayjs(normalizeDate(date)).format("YYYY-MM-DD[T]HH:mm");
}

/**
 * Format a date value into a timestamp string for backend consumption.
 *
 * This function passes the provided `date` directly to dayjs and formats it as
 * "YYYY-MM-DD[T]HH:mm:ssZ".
 *
 * @param date - Optional date input. If a string lacks an explicit timezone designator, it is not normalized here and will be interpreted according to dayjs's parsing behavior.
 * @returns A string representing the date and time with a numeric timezone offset in the form `YYYY-MM-DD[T]HH:mm:ssZ`.
 */
export function getDateTimeForBackEnd(date?: AnyDate) {
	return dayjs(date).format("YYYY-MM-DD[T]HH:mm:ssZ");
}

/**
 * Format the provided date as "YYYY-MM-DD".
 *
 * Accepts a JavaScript Date, a dayjs object, or a date string; if `date` is omitted or falsy, the current date is used.
 *
 * @param date - The date to format (Date | dayjs.Dayjs | string)
 * @returns The date formatted as `YYYY-MM-DD`
 */
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
