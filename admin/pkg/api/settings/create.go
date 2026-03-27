package settings

import (
	"database/sql"
	"dwb-admin/pkg/config"
	"dwb-admin/pkg/models"
	settingsservice "dwb-admin/pkg/services/settings"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

func (s Server) create(c *fiber.Ctx) error {
	// Parse Data
	var data settingsservice.CreateSettingsData
	if err := c.BodyParser(&data); err != nil {
		return models.ErrorBadData(c, err)
	}

	// Validate Data
	data.Normalize()
	err := models.ValidateData(data)
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	// Get db connection pool
	db, ok := s.DB.(*sql.DB)
	if !ok {
		return models.ErrorUnexpected(c, fmt.Errorf("expected *sql.DB, got %T", s.DB))
	}

	// Create in db
	ctx, cancel := s.Cfg.TransactionCtx()
	defer cancel()

	settings, err := settingsservice.CreateSettings(ctx, db, data, config.GetLogger(c))
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	// Return
	return models.Success(c, settings)
}
