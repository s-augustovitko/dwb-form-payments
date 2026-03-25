package settings

import (
	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"
	settingsservice "dwb-admin/pkg/services/settings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

func (s Server) update(c *fiber.Ctx) error {
	// Get id
	settingsID, err := uuid.Parse(utils.CopyString(c.Params("id")))
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	// Parse Data
	var data models.SettingsData
	if err := c.BodyParser(&data); err != nil {
		return models.ErrorBadData(c, err)
	}

	// Validate Data
	data.Normalize()
	err = models.ValidateData(data)
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	// Create context
	ctx, cancel := s.Cfg.WriteCtx()
	defer cancel()

	// Create data
	settingsData := database.UpdateSettingsParams{
		ID:              settingsID.String(),
		Title:           data.Title,
		Description:     data.Description,
		StartDate:       data.StartDate,
		EndDate:         data.EndDate,
		MealPricePen:    settingsservice.NormalizePrice(data.MealPricePen),
		MealPriceUsd:    settingsservice.NormalizePrice(data.MealPriceUsd),
		SessionPricePen: settingsservice.NormalizePrice(data.SessionPricePen),
		SessionPriceUsd: settingsservice.NormalizePrice(data.SessionPriceUsd),
	}

	// Update in database
	db := database.New(s.DB)
	_, err = db.UpdateSettings(ctx, settingsData)
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	// Return
	return models.Success(c, settingsData)
}
