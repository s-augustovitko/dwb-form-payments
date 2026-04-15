package addons

import (
	"context"
	"database/sql"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"
	"errors"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type upsertAddonRequest struct {
	ID     string `json:"id"`
	FormID string `json:"form_id" validate:"uuid"`

	AddonType string `json:"addon_type" validate:"required,oneof=SESSION MEAL ALL_SESSIONS_DISCOUNT EARLY_DISCOUNT"`

	Title     string  `json:"title" validate:"required,min=3,max=255"`
	SortOrder int     `json:"sort_order" validate:"gte=0"`
	Price     float64 `json:"price" validate:"gte=0"`
	Currency  string  `json:"currency" validate:"required,oneof=PEN USD"`

	Hint     string    `json:"hint" validate:"max=255"`
	DateTime time.Time `json:"date_time" validate:"required_if=AddonType SESSION,required_if=AddonType EARLY_DISCOUNT"`
}

func mapUpsertAddonToDB(addon upsertAddonRequest) database.UpsertAddonParams {
	hint := models.NormalizeString(addon.Hint)
	id := uuid.New()
	if addon.ID != "" {
		addonId, err := uuid.Parse(addon.ID)
		if err == nil {
			id = addonId
		}
	}

	return database.UpsertAddonParams{
		ID:        id.String(),
		FormID:    addon.FormID,
		Title:     models.NormalizeString(addon.Title),
		AddonType: database.AddonsAddonType(addon.AddonType),
		SortOrder: int32(addon.SortOrder),
		Price:     fmt.Sprintf("%.2f", addon.Price),
		Currency:  addon.Currency,
		DateTime:  sql.NullTime{Time: addon.DateTime.UTC(), Valid: !addon.DateTime.IsZero()},
		Hint:      sql.NullString{String: hint, Valid: hint != ""},
	}
}

func (h handler) UpsertAddon(c *fiber.Ctx) error {
	var data upsertAddonRequest
	if err := c.BodyParser(&data); err != nil {
		return models.ErrorBadData(c, err)
	}

	err := models.ValidateData(data)
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	ctx, cancel := h.cfg.WriteCtx(c.Context())
	defer cancel()

	addon := mapUpsertAddonToDB(data)
	if err := h.svc.UpsertAddon(ctx, addon); err != nil {
		return models.ErrorUnexpected(c, err)
	}

	return models.Success(c, true)
}

func (s service) UpsertAddon(ctx context.Context, data database.UpsertAddonParams) error {
	form, err := s.repo.GetFormByID(ctx, data.FormID)
	if err != nil {
		return err
	}

	if data.DateTime.Valid {
		if data.DateTime.Time.Before(form.StartDate) || data.DateTime.Time.After(form.EndDate.Add(23*time.Hour)) {
			return errors.New("addons.date_time should be between form.start_date and form.end_date")
		}
	}

	return s.repo.UpsertAddon(ctx, data)
}

func (r repository) GetFormByID(ctx context.Context, formID string) (database.GetFormByIDRow, error) {
	return r.q.GetFormByID(ctx, formID)
}

func (r repository) UpsertAddon(ctx context.Context, data database.UpsertAddonParams) error {
	return r.q.UpsertAddon(ctx, data)
}
