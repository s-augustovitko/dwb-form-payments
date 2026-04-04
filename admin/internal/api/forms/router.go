package forms

import (
	"context"
	"dwb-admin/internal/api"
	"dwb-admin/internal/config"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
)

// TODO: Review
// ├── internal/
// │   ├── http/
// │   │   ├── server.go         # Defines the Server struct & Middleware
// │   │   ├── router.go         # Registers routes: s.App.Get("/forms", s.ListFormsHandler)
// │   │   └── handlers/
// │   │       └── form_handler.go # Your controller, DTOs, and Mappers
// │   ├── service/
// │   │   └── form_service.go

type Server struct {
	*api.DefaultServer
}

func Register(app fiber.Router, srv *Server, middlewares ...fiber.Handler) {
	forms := app.Group("/forms", middlewares...)

	forms.Get("/", srv.listController)
	// forms.Get("/:id", srv.getByID)

	// forms.Post("/", srv.create)
	// forms.Put("/:id", srv.update)
	// forms.Delete("/:id", srv.delete)
	// forms.Put("/:id/active", srv.updateActive)
}

type FormType string

const (
	FormTypeConference FormType = "CONFERENCE"
	FormTypeCourse     FormType = "COURSE"
	FormTypeSpecial    FormType = "SPECIAL"
)

func (f FormType) IsValid() bool {
	switch f {
	case FormTypeConference,
		FormTypeCourse,
		FormTypeSpecial:
		return true
	}
	return false
}

type ListFormResponse struct {
	ID        string
	Title     string
	FormType  FormType
	StartDate time.Time
	EndDate   time.Time
	Active    bool
}

func getListResponseFromRow(dbItems []database.ListFormsRow, logger *slog.Logger) []ListFormResponse {
	out := make([]ListFormResponse, len(dbItems))

	for idx, dbItem := range dbItems {
		formType := FormType(dbItem.FormType)
		if ok := formType.IsValid(); !ok {
			logger.Warn("Recieved invalid formType", slog.String("formType", string(dbItem.FormType)))
			continue
		}

		out[idx] = ListFormResponse{
			ID:        dbItem.ID,
			Title:     dbItem.Title,
			FormType:  formType,
			StartDate: dbItem.StartDate,
			EndDate:   dbItem.EndDate,
			Active:    dbItem.Active,
		}
	}
	return out
}

func (s Server) listController(c *fiber.Ctx) error {
	db := database.New(s.DB)
	paging := api.GetPaging(c)
	logger := config.GetLogger(c).With(slog.Any("paging", paging))

	ctx, cancel := s.Cfg.ReadCtx()
	defer cancel()

	formsList, formsCount, err := listService(ctx, db, paging)
	if err != nil {
		return models.ErrorUnexpected(c, err)
	}

	items := getListResponseFromRow(formsList, logger)
	return models.Success(c, api.PagingResponse[ListFormResponse]{
		Items: items,
		Total: formsCount,
	})
}

func listService(ctx context.Context, db *database.Queries, paging api.Paging) ([]database.ListFormsRow, int64, error) {
	formsList, err := db.ListForms(ctx, database.ListFormsParams{
		Limit:  paging.Limit,
		Offset: paging.Skip,
	})
	if err != nil {
		return []database.ListFormsRow{}, 0, err
	}

	formsCount, err := db.CountForms(ctx)
	if err != nil {
		return []database.ListFormsRow{}, 0, err
	}

	return formsList, formsCount, nil
}
