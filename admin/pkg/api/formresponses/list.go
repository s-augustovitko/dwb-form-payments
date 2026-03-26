package formresponses

import (
	"dwb-admin/pkg/api"
	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

func (s Server) list(c *fiber.Ctx) error {
	paging := api.GetPaging(c)

	settingsID, err := uuid.Parse(utils.CopyString(c.Params("settings_id")))
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	ctx, cancel := s.Cfg.ReadCtx()
	defer cancel()

	db := database.New(s.DB)
	formResponsesList, err := db.ListFormResponsesPaged(ctx, database.ListFormResponsesPagedParams{
		SettingsID: settingsID.String(),
		Limit:      paging.Limit,
		Offset:     paging.Skip,
	})
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	return models.Success(c, formResponsesList)
}
