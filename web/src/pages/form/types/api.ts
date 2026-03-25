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
  session_time: Date;
  title: string;
}

export interface Settings {
  id: string;
  title: string;
  description: string;

  form_type: FormType;
  start_date: Date;
  end_date: Date;

  meal_price_pen: number;
  meal_price_usd: number;

  session_price_pen: number;
  session_price_usd: number;

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
