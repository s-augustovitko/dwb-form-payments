package dashboard

import (
	"context"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
)

func (h handler) GetDashboardData(c *fiber.Ctx) error {
	formIDs, err := models.GetIDsArray(utils.CopyString(c.Query("form_ids")))
	if err != nil {
		return models.ErrorBadData(c, err)
	}
	orderStatusList := models.GetStatusFromCommaSep(utils.CopyString(c.Query("order_status")))

	ctx, cancel := h.cfg.TransactionCtx(c.Context())
	defer cancel()

	formData, addons, submissions, err := h.svc.GetDashboardData(ctx, formIDs, orderStatusList)
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	items := mapOrdersAddonsSubmissionsToDashboardResponse(formData, addons, submissions)
	return models.Success(c, items)
}

func (s service) GetDashboardData(ctx context.Context, formIDs []string, orderStatusList []database.OrdersStatus) ([]database.DashboardFormOrdersRow, []database.DashboardAddonsRow, []database.DashboardSubmissionsRow, error) {
	return s.repo.GetDashboardData(ctx, formIDs, orderStatusList)
}

func (r repository) GetDashboardData(ctx context.Context, formIDs []string, orderStatusList []database.OrdersStatus) ([]database.DashboardFormOrdersRow, []database.DashboardAddonsRow, []database.DashboardSubmissionsRow, error) {
	formOrders, err := r.q.DashboardFormOrders(ctx, database.DashboardFormOrdersParams{
		Ids:    formIDs,
		Status: orderStatusList,
	})
	if err != nil {
		return []database.DashboardFormOrdersRow{}, []database.DashboardAddonsRow{}, []database.DashboardSubmissionsRow{}, err
	}

	addons, err := r.q.DashboardAddons(ctx, formIDs)
	if err != nil {
		return []database.DashboardFormOrdersRow{}, []database.DashboardAddonsRow{}, []database.DashboardSubmissionsRow{}, err
	}

	submissions, err := r.q.DashboardSubmissions(ctx, database.DashboardSubmissionsParams{
		Ids:    formIDs,
		Status: orderStatusList,
	})
	if err != nil {
		return []database.DashboardFormOrdersRow{}, []database.DashboardAddonsRow{}, []database.DashboardSubmissionsRow{}, err
	}

	return formOrders, addons, submissions, nil
}
