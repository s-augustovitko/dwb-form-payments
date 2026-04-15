package forms

import (
	"context"
	"dwb-admin/internal/api"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
)

func (h handler) ListForms(c *fiber.Ctx) error {
	paging := api.GetPaging(c)
	active := strings.ToLower(utils.CopyString(c.Query("active", "true"))) == "true"

	ctx, cancel := h.cfg.ReadCtx(c.Context())
	defer cancel()

	formsList, formsCount, err := h.svc.ListForms(ctx, database.ListFormsParams{
		Limit:  paging.Limit,
		Offset: paging.Skip,
		Active: active,
	})
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	items := mapListFormRowsToResponse(formsList)
	return models.Success(c, api.PagingResponse[listFormResponse]{
		Items: items,
		Total: formsCount,
	})
}

func (s service) ListForms(ctx context.Context, filters database.ListFormsParams) ([]database.ListFormsRow, int64, error) {
	return s.repo.ListForms(ctx, filters)
}

func (r repository) ListForms(ctx context.Context, filters database.ListFormsParams) ([]database.ListFormsRow, int64, error) {
	formsList, err := r.q.ListForms(ctx, filters)
	if err != nil {
		return []database.ListFormsRow{}, 0, err
	}

	formsCount, err := r.q.CountForms(ctx, filters.Active)
	if err != nil {
		return []database.ListFormsRow{}, 0, err
	}

	return formsList, formsCount, nil
}
