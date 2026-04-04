package main

import (
	"dwb-admin/internal/api"
	"dwb-admin/internal/config"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
)

func main() {
	errChan := make(chan error, 1)

	// Config setup
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	// Logger setup
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true, // 👈 this is the key
	}))
	slog.SetDefault(logger.With(
		slog.Group("service",
			slog.String("name", cfg.Service.Name),
			slog.String("environment", cfg.Service.Environment),
		),
	))

	// DB setup
	db, err := config.InitDb(cfg)
	if err != nil {
		slog.Error("could not init db", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer func() {
		if err := db.Close(); err != nil {
			slog.Error("could not shut down DB connections", slog.String("error", err.Error()))
		}
	}()

	// App setup
	app := fiber.New(fiber.Config{
		ProxyHeader:             fiber.HeaderXForwardedFor,
		EnableTrustedProxyCheck: true,
	})
	defer func() {
		if err := app.Shutdown(); err != nil {
			slog.Error("could not shut down app", slog.String("error", err.Error()))
		}
	}()

	// Register Routes and middlewares
	setupMiddlewares(app, cfg)

	route := app.Group("/api/v1")
	router(route, &api.DefaultServer{
		Cfg: cfg,
		DB:  db,
	})

	// Run Fiber in a goroutine
	go func() {
		slog.Info("Starting server")
		if err := app.Listen(cfg.Service.Host + ":" + cfg.Service.Port); err != nil {
			slog.Error("server listen error", slog.String("error", err.Error()))
			errChan <- err
		}
	}()

	// Graceful shutdown
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	signal.Notify(sig, os.Interrupt)

	select {
	case <-sig:
		slog.Info("shutting down server")
	case err := <-errChan:
		slog.Error("server failed", slog.String("error", err.Error()))
	}

	slog.Info("shutting down server")
}
