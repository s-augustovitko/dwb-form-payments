import moment, { type LocaleSpecification, type Moment } from "moment";

moment.updateLocale("es", esLocale());
moment.locale("es");

type AnyDate = Date | moment.Moment | string

export function normalizeDate(date?: AnyDate) {
	if (!date) return undefined;

	if (typeof date === "string") {
		const hasTimezone = new RegExp("([Zz]|[+-]\d{2}:?\d{2})$").test(date);
		date = hasTimezone ? date : `${date}Z`;
	}

	return date;
}

export function getDateForDateTimePicker(date?: AnyDate) {
	return moment(normalizeDate(date)).format("YYYY-MM-DD[T]HH:mm");
}

export function getDateTimeForBackEnd(date?: AnyDate) {
	return moment(normalizeDate(date)).format("YYYY-MM-DD[T]HH:mm:ss-05:00");
}

export function getDateForDatePicker(date?: AnyDate) {
	return moment(normalizeDate(date)).format("YYYY-MM-DD");
}

export function getDateDisplay(date?: AnyDate) {
	return moment(normalizeDate(date)).format("dddd D [de] MMM");
}

export function getDateList(date?: AnyDate) {
	return moment(normalizeDate(date)).format("dddd D | h:mm a");
}

export function getDateMap(date?: AnyDate) {
	return moment(normalizeDate(date)).format("dddd D");
}

export function getMoneyDisplay(currency: string = "PEN", amount: number = 0): string {
	const formatter = new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency: currency,
	});

	return formatter.format(amount);
}

function esLocale(): LocaleSpecification {
	var monthsParse: RegExp[] = [
		/^ene/i,
		/^feb/i,
		/^mar/i,
		/^abr/i,
		/^may/i,
		/^jun/i,
		/^jul/i,
		/^ago/i,
		/^sep/i,
		/^oct/i,
		/^nov/i,
		/^dic/i,
	],
		monthsRegex: RegExp =
			/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;

	var es: LocaleSpecification = {
		months:
			"enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split(
				"_",
			),
		monthsShort: "ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_"),
		monthsRegex: monthsRegex,
		monthsShortRegex: monthsRegex,
		monthsStrictRegex:
			/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
		monthsShortStrictRegex:
			/^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
		monthsParse: monthsParse,
		longMonthsParse: monthsParse,
		shortMonthsParse: monthsParse,
		weekdays: "domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),
		weekdaysShort: "dom_lun_mar_mié_jue_vie_sáb".split("_"),
		weekdaysMin: "do_lu_ma_mi_ju_vi_sá".split("_"),
		weekdaysParseExact: true,
		longDateFormat: {
			LT: "H:mm",
			LTS: "H:mm:ss",
			L: "DD/MM/YYYY",
			LL: "D [de] MMMM [de] YYYY",
			LLL: "D [de] MMMM [de] YYYY H:mm",
			LLLL: "dddd, D [de] MMMM [de] YYYY H:mm",
		},
		calendar: {
			sameDay(this: Moment): string {
				return `[hoy a la${this.hours() !== 1 ? "s" : ""}] LT`;
			},
			nextDay(this: Moment): string {
				return `[mañana a la${this.hours() !== 1 ? "s" : ""}] LT`;
			},
			nextWeek(this: Moment): string {
				return `dddd [a la${this.hours() !== 1 ? "s" : ""}] LT`;
			},
			lastDay(this: Moment): string {
				return `[ayer a la${this.hours() !== 1 ? "s" : ""}] LT`;
			},
			lastWeek(this: Moment): string {
				return `[el] dddd [pasado a la${this.hours() !== 1 ? "s" : ""}] LT`;
			},
			sameElse: "L",
		},
		relativeTime: {
			future: "en %s",
			past: "hace %s",
			s: "unos segundos",
			ss: "%d segundos",
			m: "un minuto",
			mm: "%d minutos",
			h: "una hora",
			hh: "%d horas",
			d: "un día",
			dd: "%d días",
			w: "una semana",
			ww: "%d semanas",
			M: "un mes",
			MM: "%d meses",
			y: "un año",
			yy: "%d años",
		},

		dayOfMonthOrdinalParse: /\d{1,2}/,
		ordinal: (n: number): string => `${n}`,

		week: {
			dow: 1, // Monday is the first day of the week.
			doy: 4, // The week that contains Jan 4th is the first week of the year.
		},

		invalidDate: "Fecha inválida",
	};

	moment.defineLocale("es", es);

	return es;
}
