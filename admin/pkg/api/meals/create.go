package meals

import (
	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

func (s Server) create(c *fiber.Ctx) error {
	settingsID, err := uuid.Parse(utils.CopyString(c.Params("settings_id")))
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	var data models.MealData
	if err := c.BodyParser(&data); err != nil {
		return models.ErrorBadData(c, err)
	}

	data.Normalize()
	if err := models.ValidateData(data); err != nil {
		return models.ErrorBadData(c, err)
	}

	ctx, cancel := s.Cfg.WriteCtx()
	defer cancel()

	meal, err := database.New(s.DB).CreateMeal(ctx, database.CreateMealParams{
		SettingsID: settingsID.String(),
		Title:      data.Title,
	})
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	return models.Success(c, meal)
}
