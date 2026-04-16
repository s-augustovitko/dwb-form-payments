package forms

import (
	"context"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

type updateFormStatusRequest struct {
	Active bool `json:"active"`
}

func (h handler) UpdateFormStatus(c *fiber.Ctx) error {
	formID, err := uuid.Parse(utils.CopyString(c.Params("id", "")))
	if err != nil {
		return models.Error(fiber.StatusBadRequest, "Invalid form", err)
	}

	var data updateFormStatusRequest
	if err = c.BodyParser(&data); err != nil {
		return models.Error(fiber.StatusBadRequest, "Invalid payload", err)
	}

	err = models.ValidateData(data)
	if err != nil {
		return err
	}

	ctx, cancel := h.cfg.WriteCtx(c.Context())
	defer cancel()

	if err = h.svc.UpdateFormStatus(ctx, database.UpdateFormStatusParams{
		ID:     formID.String(),
		Active: data.Active,
	}); err != nil {
		return err
	}

	return models.Success(c, true)
}

func (s service) UpdateFormStatus(ctx context.Context, data database.UpdateFormStatusParams) error {
	return s.repo.UpdateFormStatus(ctx, data)
}

func (r repository) UpdateFormStatus(ctx context.Context, data database.UpdateFormStatusParams) error {
	return r.q.UpdateFormStatus(ctx, data)
}
