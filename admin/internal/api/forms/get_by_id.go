package forms

import (
	"context"
	"database/sql"
	"dwb-admin/internal/config"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

func (h handler) GetPopulatedByID(c *fiber.Ctx) error {
	formID, err := uuid.Parse(utils.CopyString(c.Params("id", "")))
	if err != nil {
		return models.Error(fiber.StatusBadRequest, "Invalid form", err)
	}

	ctx, cancel := h.cfg.ReadCtx(c.Context())
	defer cancel()

	form, addons, err := h.svc.GetPopulatedByID(ctx, formID.String())
	if err != nil {
		return models.Error(fiber.StatusNotFound, "Form and addons not found", err)
	}

	logger := config.GetLogger(c)
	populatedForm := mapPopulatedFormResponse(form, addons, logger)
	return models.Success(c, populatedForm)
}

func (s service) GetPopulatedByID(ctx context.Context, formID string) (database.GetFormByIDRow, []database.GetAddonsByFormIDRow, error) {
	form, addons, err := s.repo.GetPopulatedFormByID(ctx, formID)
	if errors.Is(err, sql.ErrNoRows) {
		return form, addons, models.Error(fiber.StatusNotFound, "Form not found", err)
	}

	return form, addons, err
}

func (r repository) GetPopulatedFormByID(ctx context.Context, formID string) (database.GetFormByIDRow, []database.GetAddonsByFormIDRow, error) {
	form, err := r.q.GetFormByID(ctx, formID)
	if err != nil {
		return database.GetFormByIDRow{}, []database.GetAddonsByFormIDRow{}, err
	}

	addons, err := r.q.GetAddonsByFormID(ctx, formID)
	if err != nil {
		return database.GetFormByIDRow{}, []database.GetAddonsByFormIDRow{}, err
	}

	return form, addons, nil
}
