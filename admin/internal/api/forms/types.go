package forms

import (
	"dwb-admin/internal/database"
	"log/slog"
	"strconv"
	"time"
)

type addonType string

const (
	addonTypeSession             addonType = "SESSION"
	addonTypeMeal                addonType = "MEAL"
	addonTypeAllSessionsDiscount addonType = "ALL_SESSIONS_DISCOUNT"
	addonTypeEarlyDiscount       addonType = "EARLY_DISCOUNT"
	addonTypeInvalid             addonType = "INVALID"
)

func (f addonType) isValid() bool {
	switch f {
	case addonTypeMeal,
		addonTypeSession,
		addonTypeAllSessionsDiscount,
		addonTypeEarlyDiscount:
		return true
	}
	return false
}

func getAddonType(val string) addonType {
	at := addonType(val)
	if at.isValid() {
		return at
	}
	return addonTypeInvalid
}

type formType string

const (
	formTypeConference formType = "CONFERENCE"
	formTypeCourse     formType = "COURSE"
	formTypeSpecial    formType = "SPECIAL"
	formTypeInvalid    formType = "INVALID"
)

func (f formType) isValid() bool {
	switch f {
	case formTypeConference,
		formTypeCourse,
		formTypeSpecial:
		return true
	}
	return false
}

func getFormType(val string) formType {
	ft := formType(val)
	if ft.isValid() {
		return ft
	}
	return formTypeInvalid
}

type listFormResponse struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	FormType  formType  `json:"form_type"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	Active    bool      `json:"active"`
}

func mapListFormRowsToResponse(dbItems []database.ListFormsRow) []listFormResponse {
	out := make([]listFormResponse, len(dbItems))

	for idx, dbItem := range dbItems {
		out[idx] = listFormResponse{
			ID:        dbItem.ID,
			Title:     dbItem.Title,
			FormType:  getFormType(string(dbItem.FormType)),
			StartDate: dbItem.StartDate,
			EndDate:   dbItem.EndDate,
			Active:    dbItem.Active,
		}
	}
	return out
}

type populatedFormResponse struct {
	ID          string          `json:"id"`
	Title       string          `json:"title"`
	FormType    formType        `json:"form_type"`
	Description string          `json:"description"`
	StartDate   time.Time       `json:"start_date"`
	EndDate     time.Time       `json:"end_date"`
	Addons      []addonResponse `json:"addons"`
}

type addonResponse struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	AddonType addonType `json:"addon_type"`
	Price     float64   `json:"price"`
	Currency  string    `json:"currency"`
	Hint      string    `json:"hint"`
	DateTime  time.Time `json:"date_time"`
}

func mapPopulatedFormResponse(form database.GetFormByIDRow, addons []database.GetAddonsByFormIDRow, logger *slog.Logger) populatedFormResponse {
	addonItems := make([]addonResponse, len(addons))
	for idx, addon := range addons {
		price, err := strconv.ParseFloat(addon.Price, 64)
		if err != nil {
			logger.Warn("invalid price in addon",
				slog.String("price", addon.Price),
				slog.String("addonID", addon.ID),
				slog.String("formID", form.ID))
		}

		addonItems[idx] = addonResponse{
			ID:        addon.ID,
			Title:     addon.Title,
			AddonType: getAddonType(string(addon.AddonType)),
			Price:     price,
			Currency:  addon.Currency,
			DateTime:  addon.DateTime.Time,
			Hint:      addon.Hint.String,
		}
	}

	return populatedFormResponse{
		ID:          form.ID,
		Title:       form.Title,
		FormType:    getFormType(string(form.FormType)),
		Description: form.Description.String,
		StartDate:   form.StartDate,
		EndDate:     form.EndDate,
		Addons:      addonItems,
	}

}
