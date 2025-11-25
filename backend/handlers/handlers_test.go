package handlers

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"nodeVault/config"
	"nodeVault/models"
	"nodeVault/p2p"
	"nodeVault/storage"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ipfs/go-cid"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockNode для тестирования - реализует NodeInterface
type MockNode struct {
	mock.Mock
}

func (m *MockNode) Provide(ctx context.Context, c cid.Cid) error {
	args := m.Called(ctx, c)
	return args.Error(0)
}

func (m *MockNode) FindProviders(ctx context.Context, c cid.Cid) ([]peer.AddrInfo, error) {
	args := m.Called(ctx, c)
	return args.Get(0).([]peer.AddrInfo), args.Error(1)
}

func (m *MockNode) FetchFromNetwork(ctx context.Context, cidStr string, maxSize int64) ([]byte, *models.FileMeta, error) {
	args := m.Called(ctx, cidStr, maxSize)

	// Безопасное извлечение данных
	var data []byte
	if args.Get(0) != nil {
		data = args.Get(0).([]byte)
	}

	var meta *models.FileMeta
	if args.Get(1) != nil {
		meta = args.Get(1).(*models.FileMeta)
	}

	return data, meta, args.Error(2)
}

func (m *MockNode) GetPeerID() string {
	args := m.Called()
	return args.String(0)
}

func (m *MockNode) GetAddresses() []string {
	args := m.Called()
	return args.Get(0).([]string)
}

func (m *MockNode) GetConnectionCount() int {
	args := m.Called()
	return args.Int(0)
}

func (m *MockNode) GetStreamCount() int {
	args := m.Called()
	return args.Int(0)
}

func (m *MockNode) Close() error {
	args := m.Called()
	return args.Error(0)
}

// Ensure MockNode implements NodeInterface
var _ p2p.NodeInterface = (*MockNode)(nil)

func TestFileHandler_UploadConcurrent(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nodevault_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	store := storage.NewFileStorage(tempDir)
	defer store.Close()

	cfg := &config.Config{
		MaxFileSize:     10 * 1024 * 1024,
		CleanupInterval: time.Hour,
		StorageDir:      tempDir,
	}

	mockNode := new(MockNode)
	mockNode.On("Provide", mock.Anything, mock.Anything).Return(nil)

	handler := NewFileHandler(store, mockNode, cfg)

	var wg sync.WaitGroup
	successCount := 0
	var mu sync.Mutex

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()

			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)
			part, err := writer.CreateFormFile("file", "testfile.txt")
			assert.NoError(t, err)

			fileContent := []byte(fmt.Sprintf("test content %d", index))
			_, err = part.Write(fileContent)
			assert.NoError(t, err)

			err = writer.WriteField("ttl", "3600")
			assert.NoError(t, err)
			writer.Close()

			req, _ := http.NewRequest("POST", "/upload", body)
			req.Header.Set("Content-Type", writer.FormDataContentType())

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler.Upload(c)

			if w.Code == http.StatusOK {
				mu.Lock()
				successCount++
				mu.Unlock()
			}
		}(i)
	}

	wg.Wait()

	// Проверяем что хотя бы некоторые загрузки прошли успешно
	assert.Greater(t, successCount, 0, "At least some uploads should succeed")

	mockNode.AssertExpectations(t)
}

func TestFileHandler_DownloadConcurrent(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nodevault_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	store := storage.NewFileStorage(tempDir)
	defer store.Close()

	cfg := &config.Config{
		MaxFileSize:     10 * 1024 * 1024,
		CleanupInterval: time.Hour,
		StorageDir:      tempDir,
	}

	// Сохраняем тестовый файл
	testData := []byte("test file content")
	testMeta := &models.FileMeta{
		ID:        "test-cid",
		Filename:  "testfile.txt",
		Size:      int64(len(testData)),
		Hash:      "test-cid",
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(time.Hour),
	}
	err = store.SaveFile("test-cid", testData, testMeta)
	assert.NoError(t, err)

	mockNode := new(MockNode)
	// Не ожидаем GetPeerID для Download

	handler := NewFileHandler(store, mockNode, cfg)

	var wg sync.WaitGroup
	successCount := 0
	var mu sync.Mutex

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			req, _ := http.NewRequest("GET", "/download/test-cid", nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Params = []gin.Param{{Key: "id", Value: "test-cid"}}

			handler.Download(c)

			if w.Code == http.StatusOK && bytes.Equal(w.Body.Bytes(), testData) {
				mu.Lock()
				successCount++
				mu.Unlock()
			}
		}()
	}

	wg.Wait()

	assert.Equal(t, 10, successCount, "All downloads should succeed")
	mockNode.AssertExpectations(t)
}

func TestFileHandler_DownloadFromNetwork(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nodevault_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	store := storage.NewFileStorage(tempDir)
	defer store.Close()

	cfg := &config.Config{
		MaxFileSize:     10 * 1024 * 1024,
		CleanupInterval: time.Hour,
		StorageDir:      tempDir,
	}

	// Мок для файла из сети
	testData := []byte("network file content")
	testMeta := &models.FileMeta{
		ID:        "network-cid",
		Filename:  "networkfile.txt",
		Size:      int64(len(testData)),
		Hash:      "network-cid",
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(time.Hour),
	}

	mockNode := new(MockNode)
	mockNode.On("FetchFromNetwork", mock.Anything, "network-cid", cfg.MaxFileSize).
		Return(testData, testMeta, nil)

	handler := NewFileHandler(store, mockNode, cfg)

	// Скачиваем файл, которого нет локально
	req, _ := http.NewRequest("GET", "/download/network-cid", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = []gin.Param{{Key: "id", Value: "network-cid"}}

	handler.Download(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, testData, w.Body.Bytes())

	// Проверяем что файл сохранился локально
	_, meta, err := store.GetFile("network-cid")
	assert.NoError(t, err)
	assert.Equal(t, "networkfile.txt", meta.Filename)

	mockNode.AssertExpectations(t)
}

func TestFileHandler_UploadDownloadRace(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nodevault_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	store := storage.NewFileStorage(tempDir)
	defer store.Close()

	cfg := &config.Config{
		MaxFileSize:     10 * 1024 * 1024,
		CleanupInterval: time.Hour,
		StorageDir:      tempDir,
	}

	// Сохраняем файл для чтения
	testData := []byte("existing file content")
	testMeta := &models.FileMeta{
		ID:        "test-cid",
		Filename:  "testfile.txt",
		Size:      int64(len(testData)),
		Hash:      "test-cid",
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(time.Hour),
	}
	err = store.SaveFile("test-cid", testData, testMeta)
	assert.NoError(t, err)

	mockNode := new(MockNode)
	mockNode.On("Provide", mock.Anything, mock.Anything).Return(nil)

	handler := NewFileHandler(store, mockNode, cfg)

	var wg sync.WaitGroup
	uploadSuccess := 0
	downloadSuccess := 0
	var mu sync.Mutex

	// 5 операций записи и 5 операций чтения
	for i := 0; i < 5; i++ {
		// Запись
		wg.Add(1)
		go func(index int) {
			defer wg.Done()

			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)
			part, err := writer.CreateFormFile("file", "testfile.txt")
			if err != nil {
				return
			}

			fileContent := []byte(fmt.Sprintf("content %d", index))
			_, err = part.Write(fileContent)
			if err != nil {
				return
			}

			writer.WriteField("ttl", "3600")
			writer.Close()

			req, _ := http.NewRequest("POST", "/upload", body)
			req.Header.Set("Content-Type", writer.FormDataContentType())

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler.Upload(c)

			if w.Code == http.StatusOK {
				mu.Lock()
				uploadSuccess++
				mu.Unlock()
			}
		}(i)

		// Чтение существующего файла
		wg.Add(1)
		go func() {
			defer wg.Done()

			req, _ := http.NewRequest("GET", "/download/test-cid", nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Params = []gin.Param{{Key: "id", Value: "test-cid"}}

			handler.Download(c)

			if w.Code == http.StatusOK {
				mu.Lock()
				downloadSuccess++
				mu.Unlock()
			}
		}()
	}

	wg.Wait()

	// Проверяем что операции завершились без паники
	assert.Greater(t, uploadSuccess, 0, "Some uploads should succeed")
	assert.Equal(t, 5, downloadSuccess, "All downloads should succeed")

	mockNode.AssertExpectations(t)
}

func TestFileHandler_HealthConcurrent(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nodevault_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	store := storage.NewFileStorage(tempDir)
	defer store.Close()

	cfg := &config.Config{
		MaxFileSize:     10 * 1024 * 1024,
		CleanupInterval: time.Hour,
		StorageDir:      tempDir,
	}

	mockNode := new(MockNode)
	mockNode.On("GetPeerID").Return("test-peer-id")

	handler := NewFileHandler(store, mockNode, cfg)

	var wg sync.WaitGroup
	successCount := 0
	var mu sync.Mutex

	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			req, _ := http.NewRequest("GET", "/health", nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler.Health(c)

			if w.Code == http.StatusOK {
				body := w.Body.String()
				if strings.Contains(body, "healthy") && strings.Contains(body, "test-peer-id") {
					mu.Lock()
					successCount++
					mu.Unlock()
				}
			}
		}()
	}

	wg.Wait()

	assert.Equal(t, 20, successCount, "All health checks should succeed")
	mockNode.AssertNumberOfCalls(t, "GetPeerID", 20)
}

func TestFileHandler_UploadSizeValidation(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nodevault_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	store := storage.NewFileStorage(tempDir)
	defer store.Close()

	cfg := &config.Config{
		MaxFileSize:     100, // 100 bytes
		CleanupInterval: time.Hour,
		StorageDir:      tempDir,
	}

	mockNode := new(MockNode)
	// Не ожидаем GetPeerID для Upload

	handler := NewFileHandler(store, mockNode, cfg)

	// Пытаемся загрузить слишком большой файл
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", "largefile.txt")
	assert.NoError(t, err)

	largeContent := bytes.Repeat([]byte("x"), 150) // 150 bytes > 100 bytes limit
	_, err = part.Write(largeContent)
	assert.NoError(t, err)

	writer.WriteField("ttl", "3600")
	writer.Close()

	req, _ := http.NewRequest("POST", "/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req

	handler.Upload(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "file too large")

	mockNode.AssertExpectations(t)
}

func TestFileHandler_ConcurrentMixedOperations(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nodevault_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	store := storage.NewFileStorage(tempDir)
	defer store.Close()

	cfg := &config.Config{
		MaxFileSize:     10 * 1024 * 1024,
		CleanupInterval: time.Hour,
		StorageDir:      tempDir,
	}

	// Сохраняем несколько файлов для чтения
	testFiles := map[string][]byte{
		"local-cid-1": []byte("local file 1"),
		"local-cid-2": []byte("local file 2"),
	}

	for cid, data := range testFiles {
		meta := &models.FileMeta{
			ID:        cid,
			Filename:  cid + ".txt",
			Size:      int64(len(data)),
			Hash:      cid,
			CreatedAt: time.Now(),
			ExpiresAt: time.Now().Add(time.Hour),
		}
		err := store.SaveFile(cid, data, meta)
		assert.NoError(t, err)
	}

	mockNode := new(MockNode)
	mockNode.On("GetPeerID").Return("test-peer-id")
	mockNode.On("Provide", mock.Anything, mock.Anything).Return(nil)
	// Для network файлов - используем Maybe так как количество вызовов может варьироваться
	mockNode.On("FetchFromNetwork", mock.Anything, "network-cid-1", cfg.MaxFileSize).
		Return([]byte("network data 1"), &models.FileMeta{
			ID:        "network-cid-1",
			Filename:  "network1.txt",
			Size:      15,
			Hash:      "network-cid-1",
			CreatedAt: time.Now(),
			ExpiresAt: time.Now().Add(time.Hour),
		}, nil).Maybe()
	mockNode.On("FetchFromNetwork", mock.Anything, "network-cid-2", cfg.MaxFileSize).
		Return([]byte("network data 2"), &models.FileMeta{
			ID:        "network-cid-2",
			Filename:  "network2.txt",
			Size:      15,
			Hash:      "network-cid-2",
			CreatedAt: time.Now(),
			ExpiresAt: time.Now().Add(time.Hour),
		}, nil).Maybe()

	handler := NewFileHandler(store, mockNode, cfg)

	var wg sync.WaitGroup

	operations := []func(int){
		// Upload operations
		func(index int) {
			defer wg.Done()

			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)
			part, err := writer.CreateFormFile("file", fmt.Sprintf("file%d.txt", index))
			if err != nil {
				return
			}

			fileContent := []byte(fmt.Sprintf("content %d", index))
			_, err = part.Write(fileContent)
			if err != nil {
				return
			}

			writer.WriteField("ttl", "3600")
			writer.Close()

			req, _ := http.NewRequest("POST", "/upload", body)
			req.Header.Set("Content-Type", writer.FormDataContentType())

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler.Upload(c)
		},
		// Download operations (local files)
		func(index int) {
			defer wg.Done()

			cid := fmt.Sprintf("local-cid-%d", index%2+1) // local-cid-1 или local-cid-2
			req, _ := http.NewRequest("GET", "/download/"+cid, nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Params = []gin.Param{{Key: "id", Value: cid}}

			handler.Download(c)
		},
		// Download operations (network files)
		func(index int) {
			defer wg.Done()

			cid := fmt.Sprintf("network-cid-%d", index%2+1) // network-cid-1 или network-cid-2
			req, _ := http.NewRequest("GET", "/download/"+cid, nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Params = []gin.Param{{Key: "id", Value: cid}}

			handler.Download(c)
		},
		// Health checks
		func(index int) {
			defer wg.Done()

			req, _ := http.NewRequest("GET", "/health", nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler.Health(c)
		},
	}

	// Запускаем 20 операций
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go operations[i%len(operations)](i)
	}

	wg.Wait()

	// Тест проходит если не было паники
	// Используем AssertNotCalled для проверки что не было непредвиденных вызовов
	mockNode.AssertNotCalled(t, "FindProviders")
	mockNode.AssertNotCalled(t, "Close")
}
