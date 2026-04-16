import { AddonType, Currency, FormType } from "../../utils"
import { SelectItem } from "../../components";


// ===============
// Requests
// ===============
export interface CreateFormWithAddonsRequest {
	form_type: FormType;
	title: string;
	description?: string;
	start_date: string;
	end_date: string;
	addons: CreateFormWithAddonsAddonItemsRequest[];
}

export interface CreateFormWithAddonsAddonItemsRequest {
	addon_type: AddonType;
	title: string;
	sort_order: number;
	price: number;
	currency: Currency;

	hint?: string;
	date_time?: string;
}

export interface UpdateFormRequest {
	form_type: string;
	title: string;
	description?: string;
	start_date: string;
	end_date: string;
}

export interface UpsertAddonRequest {
	id?: string;
	form_id: string;

	addon_type: AddonType;
	title: string;
	sort_order: number;
	price: number;
	currency: Currency;

	hint?: string;
	date_time?: string;
}

// ===============
// Responses
// ===============
export interface PopulatedFormResponse {
	id: string;
	title: string;
	form_type: FormType;
	description: string;
	start_date: string;
	end_date: string;
	addons: AddonResponse[];
}

export interface AddonResponse {
	id: string;
	title: string;
	addon_type: AddonType;
	price: number;
	currency: string;
	date_time: string;
	hint: string;
}

// ===============
// Form and List
// ===============
export const formTypes: SelectItem[] = [
	{ label: "Conference", value: FormType.CONFERENCE },
	{ label: "Course", value: FormType.COURSE },
	{ label: "Special Course", value: FormType.SPECIAL },
];

export type FormListItem = {
	id: string
	title: string
	form_type: FormType
	start_date: string
	end_date: string
	active: boolean
}

