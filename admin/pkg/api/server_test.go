package api

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func newTestApp(handler fiber.Handler) *fiber.App {
	app := fiber.New()
	app.Get("/", handler)
	return app
}

func TestGetPaging_Defaults(t *testing.T) {
	var got Paging

	app := newTestApp(func(c *fiber.Ctx) error {
		got = GetPaging(c)
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	io.ReadAll(resp.Body)

	if got.Skip != 0 {
		t.Errorf("expected default Skip=0, got %d", got.Skip)
	}
	if got.Limit != 100 {
		t.Errorf("expected default Limit=100, got %d", got.Limit)
	}
}

func TestGetPaging_CustomValues(t *testing.T) {
	var got Paging

	app := newTestApp(func(c *fiber.Ctx) error {
		got = GetPaging(c)
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/?skip=25&limit=50", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	io.ReadAll(resp.Body)

	if got.Skip != 25 {
		t.Errorf("expected Skip=25, got %d", got.Skip)
	}
	if got.Limit != 50 {
		t.Errorf("expected Limit=50, got %d", got.Limit)
	}
}

func TestGetPaging_InvalidSkip_FallsBackToZero(t *testing.T) {
	var got Paging

	app := newTestApp(func(c *fiber.Ctx) error {
		got = GetPaging(c)
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/?skip=abc", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	io.ReadAll(resp.Body)

	if got.Skip != 0 {
		t.Errorf("expected Skip=0 for invalid skip value, got %d", got.Skip)
	}
}

func TestGetPaging_InvalidLimit_FallsBackTo100(t *testing.T) {
	var got Paging

	app := newTestApp(func(c *fiber.Ctx) error {
		got = GetPaging(c)
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/?limit=xyz", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	io.ReadAll(resp.Body)

	if got.Limit != 100 {
		t.Errorf("expected Limit=100 for invalid limit value, got %d", got.Limit)
	}
}

func TestGetPaging_ZeroSkipAndLimit(t *testing.T) {
	var got Paging

	app := newTestApp(func(c *fiber.Ctx) error {
		got = GetPaging(c)
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/?skip=0&limit=0", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	io.ReadAll(resp.Body)

	if got.Skip != 0 {
		t.Errorf("expected Skip=0, got %d", got.Skip)
	}
	if got.Limit != 0 {
		t.Errorf("expected Limit=0, got %d", got.Limit)
	}
}

func TestGetPaging_LargeValues(t *testing.T) {
	var got Paging

	app := newTestApp(func(c *fiber.Ctx) error {
		got = GetPaging(c)
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/?skip=1000&limit=500", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	io.ReadAll(resp.Body)

	if got.Skip != 1000 {
		t.Errorf("expected Skip=1000, got %d", got.Skip)
	}
	if got.Limit != 500 {
		t.Errorf("expected Limit=500, got %d", got.Limit)
	}
}