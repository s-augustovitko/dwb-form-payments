package dashboard

import (
	"context"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
)

func (h handler) ListForms(c *fiber.Ctx) error {
	limit, err := strconv.Atoi(utils.CopyString(c.Query("limit", "100")))
	if err != nil {
		limit = 100
	}

	ctx, cancel := h.cfg.ReadCtx(c.Context())
	defer cancel()

	formsList, err := h.svc.DashboardListForms(ctx, int32(limit))
	if err != nil {
		return err
	}

	items := mapListFormRowsToResponse(formsList)
	return models.Success(c, items)
}

func (s service) DashboardListForms(ctx context.Context, limit int32) ([]database.DashboardListFormsRow, error) {
	return s.repo.DashboardListForms(ctx, limit)
}

func (r repository) DashboardListForms(ctx context.Context, limit int32) ([]database.DashboardListFormsRow, error) {
	return r.q.DashboardListForms(ctx, limit)
}
