export enum FormType {
  'COURSE' = "COURSE",
  'SPECIAL' = "SPECIAL",
  'TALK' = "TALK"
}

export interface Meal {
  id: string;
  title: string;
}

export interface Session {
  id: string;
  session_time: string;
  title: string;
}

export interface Settings {
  id: string;
  title: string;
  description: string;

  form_type: FormType;
  start_date: string;
  end_date: string;

  meal_price_pen: string;
  meal_price_usd: string;

  session_price_pen: string;
  session_price_usd: string;

  active: boolean;
}

export interface FormDataResponse {
  settings?: Settings;

  meals?: Meal[];

  sessions?: Session[];
}

export interface EventDays {
  label: string;
  sessions: string[];
}
