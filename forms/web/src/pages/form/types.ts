import { MultiSelectItem } from "../../components"
import { AddonType, Currency, FormType } from "../../utils"

export type FormInfoResponse = {
	form: {
		id: string,
		title: string,
		description?: string,
		form_type: FormType,
	},

	addons: {
		id: string,
		title: string,
		addon_type: AddonType,
		price: string | number,
		currency: Currency,
		hint?: string,
		date_time?: string,
	}[],
}

export type AddonListsObj = {
	sessions: MultiSelectItem[],
	meals: MultiSelectItem[],
	days: MultiSelectItem[],
	daysMap: Record<string, { label: string, sessions: string[], price: number }>
}
