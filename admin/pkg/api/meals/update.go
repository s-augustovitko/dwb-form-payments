package meals

import (
	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

func (s Server) update(c *fiber.Ctx) error {
	settingsID, err := uuid.Parse(utils.CopyString(c.Params("settings_id")))
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	mealID, err := uuid.Parse(utils.CopyString(c.Params("id")))
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

	db := database.New(s.DB)
	res, err := db.UpdateMeal(ctx, database.UpdateMealParams{
		ID:         mealID.String(),
		SettingsID: settingsID.String(),
		Title:      data.Title,
	})
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	if rows, err := res.RowsAffected(); err != nil || rows != 1 {
		return models.ErrorNotFound(c, err)
	}

	return models.Success(c, map[string]string{"updated_id": mealID.String()})
}
