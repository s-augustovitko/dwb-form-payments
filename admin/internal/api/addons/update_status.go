package addons

import (
	"context"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

type updateAddonStatusRequest struct {
	Active bool `json:"active"`
}

func (h handler) UpdateAddonStatus(c *fiber.Ctx) error {
	addonID, err := uuid.Parse(utils.CopyString(c.Params("id", "")))
	if err != nil {
		return models.Error(fiber.StatusBadRequest, "Invalid addon", err)
	}

	var data updateAddonStatusRequest
	if err = c.BodyParser(&data); err != nil {
		return models.Error(fiber.StatusBadRequest, "Invalid payload", err)
	}

	err = models.ValidateData(data)
	if err != nil {
		return err
	}

	ctx, cancel := h.cfg.WriteCtx(c.Context())
	defer cancel()

	if err = h.svc.UpdateAddonStatus(ctx, database.UpdateAddonStatusParams{
		ID:     addonID.String(),
		Active: data.Active,
	}); err != nil {
		return err
	}

	return models.Success(c, true)
}

func (s service) UpdateAddonStatus(ctx context.Context, data database.UpdateAddonStatusParams) error {
	return s.repo.UpdateAddonStatus(ctx, data)
}

func (r repository) UpdateAddonStatus(ctx context.Context, data database.UpdateAddonStatusParams) error {
	return r.q.UpdateAddonStatus(ctx, data)
}
