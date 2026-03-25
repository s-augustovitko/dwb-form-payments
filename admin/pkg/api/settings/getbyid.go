package settings

import (
	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"

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

	settingsList, err := database.New(s.DB).GetSettingsByID(ctx, settingsID.String())
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	// Return
	return models.Success(c, settingsList)
}
