package forms

import (
	"context"
	"database/sql"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

type updateFormRequest struct {
	FormType    string `json:"form_type" validate:"required,oneof=CONFERENCE COURSE SPECIAL"`
	Title       string `json:"title" validate:"required,min=3,max=255"`
	Description string `json:"description" validate:"max=2000"`

	StartDate time.Time `json:"start_date" validate:"gt"`
	EndDate   time.Time `json:"end_date" validate:"gtfield=StartDate"`
}

func mapUpdateFormToDb(formID string, data updateFormRequest) database.UpdateFormParams {
	desc := models.NormalizeString(data.Description)

	return database.UpdateFormParams{
		ID:    formID,
		Title: models.NormalizeString(data.Title),
		Description: sql.NullString{
			String: desc,
			Valid:  desc != "",
		},
		StartDate: data.StartDate, // Dont convert to UTC cause it's date only
		EndDate:   data.EndDate,   // Dont convert to UTC cause it's date only
		FormType:  database.FormsFormType(data.FormType),
	}
}

func (h handler) UpdateForm(c *fiber.Ctx) error {
	formID, err := uuid.Parse(utils.CopyString(c.Params("id", "")))
	if err != nil {
		return models.Error(fiber.StatusBadRequest, "Invalid form", err)
	}

	var data updateFormRequest
	if err = c.BodyParser(&data); err != nil {
		return models.Error(fiber.StatusBadRequest, "Invalid payload", err)
	}

	err = models.ValidateData(data)
	if err != nil {
		return err
	}

	ctx, cancel := h.cfg.WriteCtx(c.Context())
	defer cancel()

	form := mapUpdateFormToDb(formID.String(), data)
	if err = h.svc.UpdateForm(ctx, form); err != nil {
		return err
	}

	return models.Success(c, true)
}

func (s service) UpdateForm(ctx context.Context, form database.UpdateFormParams) error {
	return s.repo.UpdateForm(ctx, form)
}

func (r repository) UpdateForm(ctx context.Context, form database.UpdateFormParams) error {
	return r.q.UpdateForm(ctx, form)
}
