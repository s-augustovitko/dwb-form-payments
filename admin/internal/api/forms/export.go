package forms

import (
	"bytes"
	"context"
	"database/sql"
	"dwb-admin/internal/database"
	"dwb-admin/internal/models"
	"encoding/csv"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
)

func sanitizeCSVCell(value string) string {
	if value == "" {
		return value
	}

	switch value[0] {
	case '=', '+', '-', '@', '\t', '\r', '\n':
		return "'" + value
	default:
		return value
	}
}

func strOrDefault(val string, def string) string {
	if val == "" {
		return def
	}
	return val
}

func nullTimeHandle(val sql.NullTime) string {
	if !val.Valid {
		return ""
	}
	return val.Time.Format("02/01/2006")
}

func (h handler) Export(c *fiber.Ctx) error {
	formIDs, err := models.GetIDsArray(utils.CopyString(c.Query("form_ids")))
	if err != nil {
		return models.Error(fiber.StatusBadRequest, "invalid form_ids parameter", err)
	}
	orderStatusList := models.GetStatusFromCommaSep(utils.CopyString(c.Query("order_status")))

	ctx, cancel := h.cfg.ReadCtx(c.Context())
	defer cancel()

	submissionData, err := h.svc.GetSubmissionsReport(ctx, database.GetSubmissionsReportParams{
		Status: orderStatusList,
		Ids:    formIDs,
	})
	if err != nil {
		return models.Error(fiber.StatusNotFound, "Could find report data", err)
	}

	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	headers := []string{
		"Nombres",
		"Apellidos",
		"Telefono",
		"Correo",
		"Tipo de Doc",
		"Numero de Doc",
		"Estado del Pago",
		"Cantidad Pagada",
		"Moneda",
		"Tipo de Comida",
		"Numero de Comidas",
		"Tipo de Orden",
		"Numero de Sesiones",
		"Fecha de Registro",
	}

	if err := writer.Write(headers); err != nil {
		return err
	}

	for _, item := range submissionData {
		row := []string{
			item.FirstName,
			item.LastName,
			fmt.Sprintf("(%s) %s", item.CountryCode, item.Phone),
			item.Email,
			item.IDType,
			item.IDValue,
			strOrDefault(string(item.Status), string(database.OrdersStatusDRAFT)),
			strOrDefault(item.Amount, "0.00"),
			strOrDefault(item.Currency, "PEN"),
			strOrDefault(string(item.MealType), string(database.OrdersMealTypeREGULAR)),
			item.MealCount.(string),
			strOrDefault(string(item.EventType), string(database.OrdersEventTypeALLSESSIONS)),
			item.SessionCount.(string),
			nullTimeHandle(item.CreatedAt),
		}

		for i := range row {
			row[i] = sanitizeCSVCell(row[i])
		}

		if err := writer.Write(row); err != nil {
			return err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return err
	}

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", "attachment; filename=form_responses.csv")

	return c.Send(buffer.Bytes())
}

func (s service) GetSubmissionsReport(ctx context.Context, params database.GetSubmissionsReportParams) ([]database.GetSubmissionsReportRow, error) {
	return s.repo.GetSubmissionsReport(ctx, params)
}

func (r repository) GetSubmissionsReport(ctx context.Context, params database.GetSubmissionsReportParams) ([]database.GetSubmissionsReportRow, error) {
	return r.q.GetSubmissionsReport(ctx, params)
}
