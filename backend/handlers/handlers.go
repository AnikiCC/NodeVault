package handlers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"nodeVault/config"
	"nodeVault/models"
	"nodeVault/p2p"
	"nodeVault/storage"

	"github.com/gin-gonic/gin"
)

type FileHandler struct {
	Storage *storage.FileStorage
	Node    p2p.NodeInterface
	Config  *config.Config
}

func NewFileHandler(s *storage.FileStorage, n p2p.NodeInterface, cfg *config.Config) *FileHandler {
	return &FileHandler{Storage: s, Node: n, Config: cfg}
}

func (h *FileHandler) Upload(c *gin.Context) {
	// Проверяем размер файла
	if c.Request.ContentLength > h.Config.MaxFileSize {
		msg := fmt.Sprintf("file too large: %d bytes, max: %d bytes",
			c.Request.ContentLength, h.Config.MaxFileSize)
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	// Парсим форму с лимитом
	if err := c.Request.ParseMultipartForm(h.Config.MaxFileSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse form: " + err.Error()})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing file: " + err.Error()})
		return
	}

	// Валидация TTL
	ttlStr := c.PostForm("ttl")
	ttl, err := strconv.Atoi(ttlStr)
	if err != nil || ttl <= 0 {
		ttl = 3600 // 1 hour default
	} else if ttl > 86400*30 { // Максимум 30 дней
		ttl = 86400 * 30
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open file: " + err.Error()})
		return
	}
	defer src.Close()

	// Читаем данные файла
	fileData, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file: " + err.Error()})
		return
	}

	// Проверяем размер после чтения
	if int64(len(fileData)) > h.Config.MaxFileSize {
		msg := fmt.Sprintf("file too large: %d bytes, max: %d bytes",
			len(fileData), h.Config.MaxFileSize)
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	// Вычисляем CID
	cidObj, err := p2p.CalcCID(fileData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calc cid: " + err.Error()})
		return
	}
	cidStr := cidObj.String()

	meta := &models.FileMeta{
		ID:        cidStr,
		Filename:  file.Filename,
		Size:      int64(len(fileData)),
		Hash:      cidStr,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(time.Duration(ttl) * time.Second),
	}

	// Сохраняем локально
	if err := h.Storage.SaveFile(cidStr, fileData, meta); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save failed: " + err.Error()})
		return
	}

	// Анонсируем в DHT асинхронно
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		h.Node.Provide(ctx, cidObj)
	}()

	c.JSON(http.StatusOK, gin.H{
		"status":     "ok",
		"cid":        cidStr,
		"filename":   meta.Filename,
		"expires_at": meta.ExpiresAt.Format(time.RFC3339),
		"size":       len(fileData),
		"ttl":        ttl,
	})
}

func (h *FileHandler) Download(c *gin.Context) {
	cidStr := c.Param("id")

	// Пробуем локально сначала
	data, meta, err := h.Storage.GetFile(cidStr)
	if err != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		data, meta, err = h.Node.FetchFromNetwork(ctx, cidStr, h.Config.MaxFileSize)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "file not found: " + err.Error()})
			return
		}

		// Сохраняем локально для будущих запросов
		h.Storage.SaveFile(cidStr, data, meta)
	}

	// Отправляем файл
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", meta.Filename))
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Length", fmt.Sprintf("%d", len(data)))
	c.Data(http.StatusOK, "application/octet-stream", data)
}

func (h *FileHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"node_id":   h.Node.GetPeerID(),
		"version":   "1.0.0",
	})
}
