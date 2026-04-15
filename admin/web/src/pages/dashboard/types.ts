import { AddonType, Currency, OrderStatus } from "../../utils";

export interface DashboardDataResponse {
  course_count: number;
  registration_count: number;
  total_revenue: Record<"PEN" | "USD", number>;
  status_list: StatusResponse[];
  addons: AddonResponse[];
  latest_activity: ActivityResponse[];
}

export interface StatusResponse {
  name: string;
  count: number;
}

export interface AddonResponse {
  date_time: string; // Go time.Time serializes to an ISO 8601 string
  title: string;
  addon_type: AddonType;
  currency: Currency;
  price: number;
  order_count: number;
}

export interface ActivityResponse {
  full_name: string;
  course_title: string;
  submission_date: string; // Go time.Time serializes to an ISO 8601 string
  submission_status: OrderStatus;
}
