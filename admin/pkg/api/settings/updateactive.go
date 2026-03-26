package settings

import (
	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

type updateActiveSettingsRequest struct {
	Active bool `json:"active"`
}

func (s Server) updateActiveSettings(c *fiber.Ctx) error {
	// Get id
	settingsID, err := uuid.Parse(utils.CopyString(c.Params("id")))
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	// Parse Data
	var data updateActiveSettingsRequest
	if err := c.BodyParser(&data); err != nil {
		return models.ErrorBadData(c, err)
	}

	// Validate Data
	err = models.ValidateData(data)
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	// Create context
	ctx, cancel := s.Cfg.WriteCtx()
	defer cancel()

	// Create data
	settingsData := database.UpdateActiveSettingsParams{
		ID:     settingsID.String(),
		Active: data.Active,
	}

	// Update in database
	db := database.New(s.DB)
	res, err := db.UpdateActiveSettings(ctx, settingsData)
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}
	if rows, err := res.RowsAffected(); err != nil || rows != 1 {
		return models.ErrorNotFound(c, err)
	}

	return models.Success(c, map[string]string{"updated_id": settingsID.String()})
}
