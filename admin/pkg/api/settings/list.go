package settings

import (
	"dwb-admin/pkg/api"
	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"

	"github.com/gofiber/fiber/v2"
)

func (s Server) list(c *fiber.Ctx) error {
	// Get paging params
	paging := api.GetPaging(c)

	// Get settings
	ctx, cancel := s.Cfg.ReadCtx()
	defer cancel()

	db := database.New(s.DB)
	settingsList, err := db.ListSettingsPaged(ctx, database.ListSettingsPagedParams{
		Limit:  paging.Limit,
		Offset: paging.Skip,
	})
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	settingsCount, err := db.CountSettings(ctx)
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	// Return
	return models.Success(c, api.PagingResponse[database.ListSettingsPagedRow]{Items: settingsList, Total: settingsCount})
}
