package settingsservice

import (
	"context"
	"dwb-admin/pkg/database"
	"strconv"
	"time"
)

type (
	PopulatedSettings struct {
		ID              string                      `json:"id"`
		FormType        string                      `json:"form_type"`
		Title           string                      `json:"title"`
		Description     string                      `json:"description"`
		StartDate       time.Time                   `json:"start_date"`
		EndDate         time.Time                   `json:"end_date"`
		MealPricePen    float64                     `json:"meal_price_pen"`
		MealPriceUsd    float64                     `json:"meal_price_usd"`
		SessionPricePen float64                     `json:"session_price_pen"`
		SessionPriceUsd float64                     `json:"session_price_usd"`
		Sessions        []PopulatedSettingsSessions `json:"sessions"`
		Meals           []PopulatedSettingsMeals    `json:"meals"`
	}

	PopulatedSettingsMeals struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	}

	PopulatedSettingsSessions struct {
		ID          string    `json:"id"`
		Title       string    `json:"title"`
		SessionTime time.Time `json:"session_time"`
	}
)

func transformToPopulatedSettings(setting database.GetSettingsByIDRow, sessions []database.ListSessionsBySettingsIdRow, meals []database.ListMealsBySettingsIdRow) PopulatedSettings {
	mealPricePen, _ := strconv.ParseFloat(setting.MealPricePen, 64)
	mealPriceUsd, _ := strconv.ParseFloat(setting.MealPriceUsd, 64)
	sessionPricePen, _ := strconv.ParseFloat(setting.SessionPricePen, 64)
	sessionPriceUsd, _ := strconv.ParseFloat(setting.SessionPriceUsd, 64)

	res := PopulatedSettings{
		ID:              setting.ID,
		FormType:        setting.FormType,
		Title:           setting.Title,
		Description:     setting.Description,
		StartDate:       setting.StartDate,
		EndDate:         setting.EndDate,
		MealPricePen:    mealPricePen,
		MealPriceUsd:    mealPriceUsd,
		SessionPricePen: sessionPricePen,
		SessionPriceUsd: sessionPriceUsd,
		Sessions:        []PopulatedSettingsSessions{},
		Meals:           []PopulatedSettingsMeals{},
	}

	for _, session := range sessions {
		res.Sessions = append(res.Sessions, PopulatedSettingsSessions{
			ID:          session.ID,
			Title:       session.Title,
			SessionTime: session.SessionTime,
		})
	}

	for _, meal := range meals {
		res.Meals = append(res.Meals, PopulatedSettingsMeals{
			ID:    meal.ID,
			Title: meal.Title,
		})
	}

	return res
}

func GetPopulatedSettingsByID(ctx context.Context, db database.DBTX, settingsID string) (PopulatedSettings, error) {
	setting, err := database.New(db).GetSettingsByID(ctx, settingsID)
	if err != nil {
		return PopulatedSettings{}, err
	}

	sessions, err := database.New(db).ListSessionsBySettingsId(ctx, settingsID)
	if err != nil {
		return PopulatedSettings{}, err
	}

	meals, err := database.New(db).ListMealsBySettingsId(ctx, settingsID)
	if err != nil {
		return PopulatedSettings{}, err
	}

	return transformToPopulatedSettings(setting, sessions, meals), nil
}
