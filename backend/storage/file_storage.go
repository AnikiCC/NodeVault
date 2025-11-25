package storage

import (
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"nodeVault/models"
)

type FileStorage struct {
	dir    string
	mu     sync.RWMutex
	timers map[string]*time.Timer
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func NewFileStorage(dir string) *FileStorage {
	os.MkdirAll(dir, 0755)

	ctx, cancel := context.WithCancel(context.Background())
	fs := &FileStorage{
		dir:    dir,
		timers: make(map[string]*time.Timer),
		ctx:    ctx,
		cancel: cancel,
	}

	return fs
}

// SaveFile сохраняет файл в формате: [8 байт - длина метаданных][метаданные-gob][данные]
func (s *FileStorage) SaveFile(id string, data []byte, meta *models.FileMeta) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Кодируем метаданные
	metaBuf := &bytes.Buffer{}
	if err := meta.Encode(metaBuf); err != nil {
		return fmt.Errorf("encode meta: %w", err)
	}
	metaBytes := metaBuf.Bytes()

	// Создаем общий буфер
	buf := &bytes.Buffer{}

	// 1. Длина метаданных
	if err := binary.Write(buf, binary.LittleEndian, uint64(len(metaBytes))); err != nil {
		return fmt.Errorf("write meta length: %w", err)
	}

	// 2. Метаданные
	buf.Write(metaBytes)
	// 3. Данные
	buf.Write(data)

	// Сохраняем в файл
	filePath := filepath.Join(s.dir, id+".bin")
	if err := os.WriteFile(filePath, buf.Bytes(), 0644); err != nil {
		return fmt.Errorf("write file: %w", err)
	}

	// Устанавливаем TTL таймер с поддержкой отмены
	if timer, exists := s.timers[id]; exists {
		timer.Stop()
	}

	if meta.ExpiresAt.After(time.Now()) {
		duration := time.Until(meta.ExpiresAt)
		timer := time.AfterFunc(duration, func() {
			select {
			case <-s.ctx.Done():
				return // отмена при shutdown
			default:
				s.DeleteFile(id)
			}
		})
		s.timers[id] = timer
	}

	return nil
}

// GetFile читает файл и возвращает данные и метаданные
func (s *FileStorage) GetFile(id string) ([]byte, *models.FileMeta, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	path := filepath.Join(s.dir, id+".bin")
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, nil, fmt.Errorf("read file: %w", err)
	}

	buf := bytes.NewBuffer(content)

	// 1. Читаем длину метаданных
	var metaLen uint64
	if err := binary.Read(buf, binary.LittleEndian, &metaLen); err != nil {
		return nil, nil, fmt.Errorf("read meta length: %w", err)
	}

	// 2. Читаем метаданные
	metaBytes := make([]byte, metaLen)
	if _, err := buf.Read(metaBytes); err != nil {
		return nil, nil, fmt.Errorf("read meta data: %w", err)
	}

	meta := &models.FileMeta{}
	metaBuf := bytes.NewBuffer(metaBytes)
	if err := meta.Decode(metaBuf); err != nil {
		return nil, nil, fmt.Errorf("decode meta: %w", err)
	}

	// 3. Оставшиеся байты - данные файла
	data := buf.Bytes()

	return data, meta, nil
}

// DeleteFile удаляет файл
func (s *FileStorage) DeleteFile(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if timer, exists := s.timers[id]; exists {
		timer.Stop()
		delete(s.timers, id)
	}

	filePath := filepath.Join(s.dir, id+".bin")
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("remove file: %w", err)
	}

	return nil
}

// CleanupExpired удаляет все просроченные файлы
func (s *FileStorage) CleanupExpired() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	files, err := os.ReadDir(s.dir)
	if err != nil {
		return fmt.Errorf("read storage dir: %w", err)
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) != ".bin" {
			continue
		}

		id := file.Name()[:len(file.Name())-4] // убираем .bin
		_, meta, err := s.getFileWithoutLock(id)
		if err != nil {
			continue
		}

		if time.Now().After(meta.ExpiresAt) {
			s.deleteFileWithoutLock(id)
		}
	}

	return nil
}

// getFileWithoutLock внутренний метод без блокировки
func (s *FileStorage) getFileWithoutLock(id string) ([]byte, *models.FileMeta, error) {
	path := filepath.Join(s.dir, id+".bin")
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, nil, err
	}

	buf := bytes.NewBuffer(content)

	var metaLen uint64
	if err := binary.Read(buf, binary.LittleEndian, &metaLen); err != nil {
		return nil, nil, err
	}

	metaBytes := make([]byte, metaLen)
	if _, err := buf.Read(metaBytes); err != nil {
		return nil, nil, err
	}

	meta := &models.FileMeta{}
	metaBuf := bytes.NewBuffer(metaBytes)
	if err := meta.Decode(metaBuf); err != nil {
		return nil, nil, err
	}

	data := buf.Bytes()
	return data, meta, nil
}

// deleteFileWithoutLock внутренний метод без блокировки
func (s *FileStorage) deleteFileWithoutLock(id string) error {
	if timer, exists := s.timers[id]; exists {
		timer.Stop()
		delete(s.timers, id)
	}

	filePath := filepath.Join(s.dir, id+".bin")
	return os.Remove(filePath)
}

// Close останавливает все фоновые процессы
func (s *FileStorage) Close() {
	s.cancel()
	s.wg.Wait()

	// Останавливаем все таймеры
	s.mu.Lock()
	defer s.mu.Unlock()

	for id, timer := range s.timers {
		timer.Stop()
		delete(s.timers, id)
	}
}
