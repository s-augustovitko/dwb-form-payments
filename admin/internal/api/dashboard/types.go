package dashboard

import (
	"dwb-admin/internal/database"
	"fmt"
	"strconv"
	"time"
)

type listFormsResponse struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

func mapListFormRowsToResponse(data []database.DashboardListFormsRow) []listFormsResponse {
	out := make([]listFormsResponse, len(data))
	for idx, item := range data {
		out[idx] = listFormsResponse{
			ID:    item.ID,
			Title: item.Title,
		}
	}
	return out
}

type dashboardDataResponse struct {
	CourseCount       int                `json:"course_count"`
	RegistrationCount float64            `json:"registration_count"`
	TotalRevenue      map[string]float64 `json:"total_revenue"`
	StatusList        []statusResponse   `json:"status_list"`
	Addons            []addonResponse    `json:"addons"`
	LatestActivity    []activityResponse `json:"latest_activity"`
}

type statusResponse struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type addonResponse struct {
	DateTime   time.Time `json:"date_time"`
	Title      string    `json:"title"`
	AddonType  string    `json:"addon_type"`
	Currency   string    `json:"currency"`
	Price      float64   `json:"price"`
	OrderCount int       `json:"order_count"`
}

type activityResponse struct {
	FullName         string    `json:"full_name"`
	CourseTitle      string    `json:"course_title"`
	SubmissionDate   time.Time `json:"submission_date"`
	SubmissionStatus string    `json:"submission_status"`
}

func mapOrdersAddonsSubmissionsToDashboardResponse(formOrders []database.DashboardFormOrdersRow, addons []database.DashboardAddonsRow, submissions []database.DashboardSubmissionsRow) dashboardDataResponse {
	out := dashboardDataResponse{
		CourseCount:       0,
		RegistrationCount: 0,
		TotalRevenue:      map[string]float64{"PEN": 0.0, "USD": 0.0},
		StatusList:        []statusResponse{},
		Addons:            make([]addonResponse, len(addons)),
		LatestActivity:    make([]activityResponse, len(submissions)),
	}

	for idx, addon := range addons {
		price, _ := strconv.ParseFloat(addon.Price, 64)
		out.Addons[idx] = addonResponse{
			DateTime:   addon.DateTime.Time,
			Title:      addon.Title,
			AddonType:  string(addon.AddonType),
			Currency:   addon.Currency,
			Price:      price,
			OrderCount: int(addon.OrderCount),
		}
	}

	for idx, submission := range submissions {
		out.LatestActivity[idx] = activityResponse{
			FullName:         fmt.Sprintf("%s %s", submission.FirstName, submission.LastName),
			CourseTitle:      submission.Title,
			SubmissionDate:   submission.CreatedAt.Time,
			SubmissionStatus: string(submission.Status),
		}
	}

	statusMap := map[string]int{
		"DRAFT":     0,
		"CONFIRMED": 0,
		"CANCELLED": 0,
		"ON_SITE":   0,
	}
	for _, formOrder := range formOrders {
		if draftCount, err := strconv.Atoi(formOrder.DraftCount.(string)); err != nil {
			statusMap["DRAFT"] += draftCount
		}
		if cancelledCount, err := strconv.Atoi(formOrder.CancelledCount.(string)); err != nil {
			statusMap["CANCELLED"] += cancelledCount
		}
		if onSiteCount, err := strconv.Atoi(formOrder.OnSiteCount.(string)); err != nil {
			statusMap["ON_SITE"] += onSiteCount
		}
		if confirmedCount, err := strconv.Atoi(formOrder.ConfirmedCount.(string)); err != nil {
			statusMap["CONFIRMED"] += confirmedCount
		}

		rev, _ := strconv.ParseFloat(formOrder.Revenue.(string), 64)
		out.TotalRevenue[formOrder.Currency] += rev

		out.CourseCount += int(formOrder.FormCount)
		out.RegistrationCount += float64(formOrder.OrderCount)
	}

	for name, count := range statusMap {
		out.StatusList = append(out.StatusList, statusResponse{
			Name:  name,
			Count: count,
		})
	}

	return out
}
