package config

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/go-sql-driver/mysql"
)

func InitDb(cfg *Config) (*sql.DB, error) {
	dsn := (&mysql.Config{
		User:                 cfg.Db.User,
		Passwd:               cfg.Db.Pass,
		Net:                  "tcp",
		Addr:                 cfg.Db.Host,
		DBName:               cfg.Db.Name,
		ParseTime:            true,
		AllowNativePasswords: true,
	}).FormatDSN()

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	db.SetConnMaxLifetime(time.Minute * 3)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}
