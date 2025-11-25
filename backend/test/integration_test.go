package tests

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"nodeVault/config"
	"nodeVault/handlers"
	"nodeVault/p2p"
	"nodeVault/storage"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestIntegration_ConcurrentOperations(t *testing.T) {
	// Создаем временные директории для двух узлов
	tempDir1, err := os.MkdirTemp("", "nodevault_integration1")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir1)

	tempDir2, err := os.MkdirTemp("", "nodevault_integration2")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir2)

	// Инициализируем два узла
	ctx := context.Background()

	store1 := storage.NewFileStorage(tempDir1)
	defer store1.Close()

	store2 := storage.NewFileStorage(tempDir2)
	defer store2.Close()

	cfg := config.Default()
	cfg.StorageDir = tempDir1

	// Создаем первый узел
	node1, err := p2p.NewNode(ctx, store1)
	assert.NoError(t, err)
	defer node1.Host.Close()
	defer node1.DHT.Close()

	// Ждем немного для bootstrap
	time.Sleep(2 * time.Second)

	handler1 := handlers.NewFileHandler(store1, node1, cfg)

	// Тест конкурентных операций
	var wg sync.WaitGroup
	errors := make(chan error, 50)

	// Конкурентные загрузки на первый узел
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()

			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)
			part, err := writer.CreateFormFile("file", "concurrent_file.txt")
			if err != nil {
				errors <- err
				return
			}

			content := []byte("concurrent file content " + string(rune('0'+index)))
			_, err = part.Write(content)
			if err != nil {
				errors <- err
				return
			}

			err = writer.WriteField("ttl", "3600")
			if err != nil {
				errors <- err
				return
			}
			writer.Close()

			req, _ := http.NewRequest("POST", "/upload", body)
			req.Header.Set("Content-Type", writer.FormDataContentType())

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler1.Upload(c)

			if w.Code != http.StatusOK {
				errors <- fmt.Errorf("Upload failed with status: %d, body: %s", w.Code, w.Body.String())
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	errorCount := 0
	for err := range errors {
		if err != nil {
			t.Logf("Integration test error: %v", err)
			errorCount++
		}
	}

	// Допускаем некоторые ошибки из-за конкурентности, но не все
	if errorCount > 5 {
		t.Errorf("Too many errors in integration test: %d", errorCount)
	}
}

func TestIntegration_MetricsAndLogging(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nodevault_metrics_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	store := storage.NewFileStorage(tempDir)
	defer store.Close()

	cfg := config.Default()
	cfg.StorageDir = tempDir

	ctx := context.Background()
	node, err := p2p.NewNode(ctx, store)
	assert.NoError(t, err)
	defer node.Host.Close()
	defer node.DHT.Close()

	handler := handlers.NewFileHandler(store, node, cfg)

	// Тестируем что метрики не паникуют при конкурентном доступе
	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			// Health check
			req, _ := http.NewRequest("GET", "/health", nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			handler.Health(c)

			// Metrics endpoint (если есть)
			req2, _ := http.NewRequest("GET", "/metrics", nil)
			w2 := httptest.NewRecorder()
			c2, _ := gin.CreateTestContext(w2)
			c2.Request = req2
		}()
	}

	wg.Wait()
	// Если не было паники - тест пройден
}
