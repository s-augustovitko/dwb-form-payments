package settingsservice

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"strconv"

	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"

	"github.com/google/uuid"
)

type CreateSettingsData struct {
	models.SettingsData

	Meals    []models.MealData    `json:"meals,omitempty"`
	Sessions []models.SessionData `json:"sessions" validate:"required,gte=1"`
}

func handleTx(tx *sql.Tx, commited *bool, logger *slog.Logger) {
	if *commited {
		return
	}

	if err := tx.Rollback(); err != nil {
		logger.Error("could not roll back", slog.String("error", err.Error()))
	}
}

func NormalizePrice(price float64) string {
	return strconv.FormatFloat(price, 'f', 2, 64)
}

func CreateSettings(ctx context.Context, db *sql.DB, data CreateSettingsData, logger *slog.Logger) (database.ListSettingsPagedRow, error) {
	var err error

	settingsID := uuid.New().String()

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return database.ListSettingsPagedRow{}, err
	}

	logger = logger.With(
		slog.Group("attributes",
			slog.String("settings_id", settingsID),
			slog.String("form_type", data.FormType),
			slog.Int("meals_count", len(data.Meals)),
			slog.Int("sessions_count", len(data.Sessions)),
		),
	)

	committed := false
	defer handleTx(tx, &committed, logger)

	qtx := database.New(db).WithTx(tx)

	settingsData := database.CreateSettingsParams{
		ID:              settingsID,
		Title:           data.Title,
		Description:     data.Description,
		FormType:        data.FormType,
		StartDate:       data.StartDate,
		EndDate:         data.EndDate,
		MealPricePen:    NormalizePrice(data.MealPricePen),
		MealPriceUsd:    NormalizePrice(data.MealPriceUsd),
		SessionPricePen: NormalizePrice(data.SessionPricePen),
		SessionPriceUsd: NormalizePrice(data.SessionPriceUsd),
	}

	res, err := qtx.CreateSettings(ctx, settingsData)
	if err != nil {
		logger.Error("create settings failed", slog.String("error", err.Error()))
		return database.ListSettingsPagedRow{}, err
	}
	if rows, err := res.RowsAffected(); err != nil || rows != 1 {
		return database.ListSettingsPagedRow{}, fmt.Errorf("could not create settings: %s", err.Error())
	}

	var mealCount int64
	for _, meal := range data.Meals {
		res, err = qtx.CreateMeal(ctx, database.CreateMealParams{
			ID:         uuid.New().String(),
			SettingsID: settingsID,
			Title:      meal.Title,
		})
		if err != nil {
			logger.Error("create meal failed", slog.String("error", err.Error()))
			return database.ListSettingsPagedRow{}, err
		}
		if rows, err := res.RowsAffected(); err != nil || rows != 1 {
			return database.ListSettingsPagedRow{}, fmt.Errorf("could not create meal: %s", err.Error())
		}

		mealCount++
	}

	var sessionCount int64
	for _, session := range data.Sessions {
		res, err = qtx.CreateSession(ctx, database.CreateSessionParams{
			ID:          uuid.New().String(),
			SettingsID:  settingsID,
			Title:       session.Title,
			SessionTime: session.SessionTime,
		})
		if err != nil {
			logger.Error("create session failed", slog.String("error", err.Error()))
			return database.ListSettingsPagedRow{}, err
		}
		if rows, err := res.RowsAffected(); err != nil || rows != 1 {
			return database.ListSettingsPagedRow{}, fmt.Errorf("could not create session: %s", err.Error())
		}

		sessionCount++
	}

	if err = tx.Commit(); err != nil {
		return database.ListSettingsPagedRow{}, err
	}
	committed = true

	return database.ListSettingsPagedRow{
		ID:           settingsID,
		FormType:     data.FormType,
		Title:        data.Title,
		StartDate:    data.StartDate,
		EndDate:      data.EndDate,
		MealCount:    mealCount,
		SessionCount: sessionCount,
		Active:       true,
	}, nil
}
