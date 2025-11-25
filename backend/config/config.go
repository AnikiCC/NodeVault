package config

import "time"

type Config struct {
	MaxFileSize     int64
	CleanupInterval time.Duration
	StorageDir      string
}

func Default() *Config {
	return &Config{
		MaxFileSize:     500 * 1024 * 1024, // 500 MB
		CleanupInterval: time.Hour,
		StorageDir:      "./data",
	}
}
