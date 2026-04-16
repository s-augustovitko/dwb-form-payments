import dayjs from "dayjs";

dayjs.locale("en");

type AnyDate = Date | dayjs.Dayjs | string

function normalizeDate(date?: AnyDate) {
	if (!date) return undefined;

	if (typeof date === "string") {
		const hasTimezone = new RegExp(/([Zz]|[+-]\d{2}:?\d{2})$/).test(date);
		date = hasTimezone ? date : `${date}Z`;
	}

	return date;
}

function onlyDate(date?: AnyDate) {
	if (!date) return undefined;

	if (typeof date === "string") {
		date = date.split('T').at(0)
	}

	return date;
}

export function getDateForDateTimePicker(date?: AnyDate) {
	return dayjs(normalizeDate(date)).format("YYYY-MM-DD[T]HH:mm");
}

export function getDateTimeForBackEnd(date?: AnyDate) {
	return dayjs(date).format("YYYY-MM-DD[T]HH:mm:ssZ");
}

export function getDateForDatePicker(date?: AnyDate, hour: number = 11) {
	return dayjs(onlyDate(date)).hour(hour).format("YYYY-MM-DD");
}

export function getDateDisplay(date?: AnyDate) {
	return dayjs(normalizeDate(date)).format("ddd[,] MMM D");
}

export function getMoneyDisplay(currency: string = "PEN", amount: number = 0): string {
	const formatter = new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency: currency,
	});

	return formatter.format(amount);
}
