package dashboard

import (
	"context"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"

	"github.com/gofiber/fiber/v2"
)

func (h handler) ListForms(c *fiber.Ctx) error {
	ctx, cancel := h.cfg.ReadCtx(c.Context())
	defer cancel()

	formsList, err := h.svc.DashboardListForms(ctx, 100)
	if err != nil {
		return models.ErrorUnexpected(c, err)
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
