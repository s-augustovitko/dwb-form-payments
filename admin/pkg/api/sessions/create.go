package sessions

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

	var data models.SessionData
	if err := c.BodyParser(&data); err != nil {
		return models.ErrorBadData(c, err)
	}

	data.Normalize()
	if err := models.ValidateData(data); err != nil {
		return models.ErrorBadData(c, err)
	}

	ctx, cancel := s.Cfg.WriteCtx()
	defer cancel()

	id := uuid.New()
	res, err := database.New(s.DB).CreateSession(ctx, database.CreateSessionParams{
		ID:          id.String(),
		SettingsID:  settingsID.String(),
		Title:       data.Title,
		SessionTime: data.SessionTime,
	})
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	if rows, err := res.RowsAffected(); err != nil || rows != 1 {
		return models.ErrorUnexpected(c, err)
	}

	return models.Success(c, map[string]string{"created_id": id.String()})
}
