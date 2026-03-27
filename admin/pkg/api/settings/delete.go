package settings

import (
	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

func (s Server) delete(c *fiber.Ctx) error {
	settingsID, err := uuid.Parse(utils.CopyString(c.Params("id")))
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	ctx, cancel := s.Cfg.WriteCtx()
	defer cancel()

	db := database.New(s.DB)
	res, err := db.DeleteSettings(ctx, settingsID.String())
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	if rows, err := res.RowsAffected(); err != nil || rows != 1 {
		return models.ErrorNotFound(c, err)
	}

	return models.Success(c, map[string]string{"deleted_id": settingsID.String()})
}
