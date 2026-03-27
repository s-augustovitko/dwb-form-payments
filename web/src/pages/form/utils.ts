import { MultiSelectItem } from "../../components"
import { getDateList, getDateMap, getMoneyDisplay } from "../../utils"
import { Currency, EventDays, Meal, Session } from "./types"

export const getMealsList = (items: Meal[] = [], currency: string = Currency.PEN, mealPrice: number = 0): MultiSelectItem[] => {
  return items?.map((item) => ({
    title: getMoneyDisplay(currency, mealPrice),
    subtitle: item.title,
    value: item.id,
  }))
}

export const getSessionList = (items: Session[] = []) => {
  return items?.map((item) => ({
    title: getDateList(item.session_time),
    subtitle: item.title,
    value: item.id,
  }))
}

export function getDaysList(items: EventDays[] = [], currency: string = Currency.PEN, sessionPrice: number = 0): MultiSelectItem[] {
  return items.map((item) => ({
    title: getMoneyDisplay(currency, sessionPrice * item.sessions.length),
    subtitle: `${item.label} | ${item.sessions.length} sesion${item.sessions.length > 1 ? "es" : ""}`,
    value: item.label
  }))
}

export function convertListToMapping(items: MultiSelectItem[] = []): Record<string, string> {
  return items.reduce((acc, item) => {
    acc[item.value] = item.subtitle
    return acc
  }, {} as Record<string, string>)
}

export function getDaysFromSessions(eventSessions: Session[] = []): Record<string, EventDays> {
  return eventSessions.reduce((prev: Record<string, EventDays>, cur) => {
    const key = getDateMap(cur.session_time);

    if (prev[key]) {
      prev[key].sessions.push(cur.id);
    } else {
      prev[key] = {
        label: key,
        sessions: [cur.id],
      };
    }
    return prev;
  }, {})
}
