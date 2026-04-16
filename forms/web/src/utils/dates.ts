import dayjs from "dayjs";

dayjs.locale("es", esLocale());

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


function esLocale(): ILocale {
	var es: ILocale = {
		months: "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split(
			"_"
		),
		monthsShort: "ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_"),
		weekdays: "domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),
		weekdaysShort: "dom_lun_mar_mié_jue_vie_sáb".split("_"),
		weekdaysMin: "do_lu_ma_mi_ju_vi_sá".split("_"),
		relativeTime: {
			future: "en %s",
			past: "hace %s",
			s: "unos segundos",
			m: "un minuto",
			mm: "%d minutos",
			h: "una hora",
			hh: "%d horas",
			d: "un día",
			dd: "%d días",
			M: "un mes",
			MM: "%d meses",
			y: "un año",
			yy: "%d años",
		},

		ordinal: (n: number): string => `${n}`,
		name: "",
		formats: {
			LT: "H:mm",
			LTS: "H:mm:ss",
			L: "DD/MM/YYYY",
			LL: "D [de] MMMM [de] YYYY",
			LLL: "D [de] MMMM [de] YYYY H:mm",
			LLLL: "dddd, D [de] MMMM [de] YYYY H:mm",
		}
	};

	return es;
}
