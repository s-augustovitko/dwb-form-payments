package formresponses

import (
	"bytes"
	"database/sql"
	"dwb-admin/pkg/database"
	"dwb-admin/pkg/models"
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

func sanitizeCSVCell(value string) string {
	if value == "" {
		return value
	}

	switch value[0] {
	case '=', '+', '-', '@':
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

func (s Server) export(c *fiber.Ctx) error {
	success_only := utils.CopyString(c.Query("success_only"))

	settingsID, err := uuid.Parse(utils.CopyString(c.Params("settings_id")))
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	ctx, cancel := s.Cfg.WriteCtx()
	defer cancel()

	db := database.New(s.DB)
	settings, err := db.GetSettingsByID(ctx, settingsID.String())
	if err != nil {
		return models.ErrorBadData(c, err)
	}

	var formResponses []database.FormResponse
	if strings.ToLower(success_only) == "true" {
		formResponses, err = db.ListSuccessFormResponses(ctx, settingsID.String())
	} else {
		formResponses, err = db.ListAllFormResponses(ctx, settingsID.String())
	}
	if err != nil {
		return models.ErrorUnexpected(c, err)
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
	}
	switch settings.FormType {
	case "COURSE":
		headers = append(headers, []string{
			"Moneda",
			"Tipo de Comida",
			"Numero de Comidas",
			"Tipo de Pago",
			"Numero de Sesiones",
		}...)
	case "SPECIAL":
		headers = append(headers, []string{
			"Moneda",
			"Tipo de Comida",
			"Numero de Comidas",
			"Tipo de Pago",
			"Numero de Sesiones",
			"Fecha de Llegada",
			"Fecha de Regreso",
			"Seguro Medico",
			"C. Emergencia",
			"C. Emergencia Telefono",
			"C. Emergencia Correo",
		}...)
	}
	headers = append(headers, "Codigo de Pago")

	if err := writer.Write(headers); err != nil {
		return models.ErrorUnexpected(c, err)
	}

	for _, item := range formResponses {
		row := []string{
			item.FirstName,
			item.LastName,
			fmt.Sprintf("(%s) %s", item.CountryCode, item.Phone),
			item.Email,
			item.IDType,
			item.IDValue,
			strOrDefault(item.PaymentStatus.String, "UNAVAILABLE"),
			item.PaymentAmount,
		}
		switch settings.FormType {
		case "COURSE":
			row = append(row, []string{
				strOrDefault(item.Currency.String, "PEN"),
				strOrDefault(item.MealType.String, "REGULAR"),
				strconv.Itoa(int(item.MealsCount.Int32)),
				strOrDefault(item.EventType.String, "FULL"),
				strconv.Itoa(int(item.SessionsCount.Int32)),
			}...)
		case "SPECIAL":
			row = append(row, []string{
				strOrDefault(item.Currency.String, "PEN"),
				strOrDefault(item.MealType.String, "REGULAR"),
				strconv.Itoa(int(item.MealsCount.Int32)),
				strOrDefault(item.EventType.String, "FULL"),
				strconv.Itoa(int(item.SessionsCount.Int32)),
				nullTimeHandle(item.ArrivalDate),
				nullTimeHandle(item.DepartureDate),
				item.MedicalInsurance.String,
				item.EmergencyContactName.String,
				fmt.Sprintf("(%s) %s",
					item.EmergencyContactCountryCode.String,
					item.EmergencyContactPhone.String),
				item.EmergencyContactEmail.String,
			}...)
		}
		row = append(row, item.PaymentID.String)

		for i := range row {
			row[i] = sanitizeCSVCell(row[i])
		}

		if err := writer.Write(row); err != nil {
			return models.ErrorUnexpected(c, err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return models.ErrorUnexpected(c, err)
	}

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=form_responses_%s.csv", settingsID))

	return c.Send(buffer.Bytes())
}
