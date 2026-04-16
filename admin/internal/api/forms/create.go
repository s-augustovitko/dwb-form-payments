package forms

import (
	"context"
	"database/sql"
	"dwb-admin/internal/config"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"
	"fmt"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type (
	createFormWithAddonsRequest struct {
		FormType string `json:"form_type" validate:"required,oneof=CONFERENCE COURSE SPECIAL"`

		Title       string `json:"title" validate:"required,min=3,max=255"`
		Description string `json:"description" validate:"max=2000"`

		StartDate time.Time `json:"start_date" validate:"gt"`
		EndDate   time.Time `json:"end_date" validate:"gtfield=StartDate"`

		Addons []createAddonRequest `json:"addons" validate:"required,gte=1,dive"`
	}

	createAddonRequest struct {
		AddonType string `json:"addon_type" validate:"required,oneof=SESSION MEAL ALL_SESSIONS_DISCOUNT EARLY_DISCOUNT"`

		Title     string  `json:"title" validate:"required,min=3,max=255"`
		SortOrder int     `json:"sort_order" validate:"gte=0"`
		Price     float64 `json:"price" validate:"gte=0"`
		Currency  string  `json:"currency" validate:"required,oneof=PEN USD"`

		Hint     string    `json:"hint" validate:"max=255"`
		DateTime time.Time `json:"date_time" validate:"required_if=AddonType SESSION,required_if=AddonType EARLY_DISCOUNT"`
	}
)

func mapCreateFormWithAddonsToDb(data createFormWithAddonsRequest) (database.CreateFormParams, []database.CreateAddonParams) {
	formId := uuid.NewString()

	addons := make([]database.CreateAddonParams, len(data.Addons))
	for idx, addon := range data.Addons {
		hint := models.NormalizeString(addon.Hint)

		addons[idx] = database.CreateAddonParams{
			ID:        uuid.NewString(),
			FormID:    formId,
			Title:     models.NormalizeString(addon.Title),
			AddonType: database.AddonsAddonType(addon.AddonType),
			SortOrder: int32(addon.SortOrder),
			Price:     fmt.Sprintf("%.2f", addon.Price),
			Currency:  addon.Currency,
			DateTime:  sql.NullTime{Time: addon.DateTime.UTC(), Valid: !addon.DateTime.IsZero()},
			Hint:      sql.NullString{String: hint, Valid: hint != ""},
		}
	}

	desc := models.NormalizeString(data.Description)
	return database.CreateFormParams{
		ID:          formId,
		Title:       models.NormalizeString(data.Title),
		Description: sql.NullString{String: desc, Valid: desc != ""},
		FormType:    database.FormsFormType(data.FormType),
		StartDate:   data.StartDate, // Dont convert to UTC cause it's date only
		EndDate:     data.EndDate,   // Dont convert to UTC cause it's date only
	}, addons
}

func (h handler) CreateFormWithAddons(c *fiber.Ctx) error {
	var data createFormWithAddonsRequest
	if err := c.BodyParser(&data); err != nil {
		return models.Error(fiber.StatusBadRequest, "Invalid payload", err)
	}

	err := models.ValidateData(data)
	if err != nil {
		return err
	}

	ctx, cancel := h.cfg.TransactionCtx(c.Context())
	defer cancel()

	form, addons := mapCreateFormWithAddonsToDb(data)
	logger := config.GetLogger(c).With(slog.Any("data", data))

	if err := h.svc.CreateFormWithAddons(ctx, form, addons, logger); err != nil {
		return err
	}

	return models.Success(c, true)
}

func (s service) CreateFormWithAddons(ctx context.Context, form database.CreateFormParams, addons []database.CreateAddonParams, logger *slog.Logger) error {
	var sessionCount int
	for idx, item := range addons {
		if item.AddonType == database.AddonsAddonTypeSESSION {
			sessionCount++
		}

		if !item.DateTime.Valid {
			continue
		}
		if item.DateTime.Time.Before(form.StartDate) || item.DateTime.Time.After(form.EndDate) {
			return models.Error(
				fiber.StatusBadRequest, fmt.Sprintf(
					"addons.%d.date_time should be between form.start_date and form.end_date",
					idx,
				), nil)
		}
	}

	if sessionCount == 0 {
		return models.Error(fiber.StatusBadRequest, "must have at least 1 session", nil)
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err == nil {
			return
		}

		if txErr := tx.Rollback(); txErr != nil {
			logger.Warn("Could not commit or rollback", slog.String("warning", txErr.Error()))
		}
	}()

	txRepo := s.repo.WithTx(tx)

	if err = txRepo.CreateForm(ctx, form); err != nil {
		return err
	}
	if err = txRepo.CreateAddons(ctx, addons); err != nil {
		return err
	}

	err = tx.Commit()
	return err
}

func (r repository) CreateForm(ctx context.Context, form database.CreateFormParams) error {
	return r.q.CreateForm(ctx, form)
}

func (r repository) CreateAddons(ctx context.Context, addons []database.CreateAddonParams) error {
	for _, addon := range addons {
		if err := r.q.CreateAddon(ctx, addon); err != nil {
			return err
		}
	}

	return nil
}
