package settings

import (
	"dwb-admin/pkg/models"
	settingsservice "dwb-admin/pkg/services/settings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

func (s Server) getByID(c *fiber.Ctx) error {
	// Get id
	settingsID, err := uuid.Parse(utils.CopyString(c.Params("id")))
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	// Get settings
	ctx, cancel := s.Cfg.ReadCtx()
	defer cancel()

	settings, err := settingsservice.GetPopulatedSettingsByID(ctx, s.DB, settingsID.String())
	if err != nil {
		return models.ErrorNotFound(c, err)
	}

	// Return
	return models.Success(c, settings)
}
