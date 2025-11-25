package storage

import (
	"nodeVault/models"
	"os"
	"sync"
	"testing"
	"time"
)

func TestConcurrentAccess(t *testing.T) {
	store := NewFileStorage("./test_data")
	defer store.Close()
	defer func() {
		// Cleanup
		store.CleanupExpired()
	}()

	cid := "test123"
	data := []byte("test file content")
	meta := &models.FileMeta{
		ID:        cid,
		Filename:  "test.txt",
		Size:      int64(len(data)),
		Hash:      cid,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(time.Hour),
	}

	// Тест конкурентной записи
	t.Run("ConcurrentWrites", func(t *testing.T) {
		var wg sync.WaitGroup
		errors := make(chan error, 10)

		for i := 0; i < 10; i++ {
			wg.Add(1)
			go func(index int) {
				defer wg.Done()
				testData := append(data, byte(index))
				err := store.SaveFile(cid, testData, meta)
				if err != nil {
					errors <- err
				}
			}(i)
		}

		wg.Wait()
		close(errors)

		for err := range errors {
			if err != nil {
				t.Errorf("Concurrent write error: %v", err)
			}
		}
	})

	// Тест конкурентного чтения и записи
	t.Run("ConcurrentReadWrite", func(t *testing.T) {
		var wg sync.WaitGroup
		readErrors := make(chan error, 5)
		writeErrors := make(chan error, 5)

		// Писатели
		for i := 0; i < 5; i++ {
			wg.Add(1)
			go func(index int) {
				defer wg.Done()
				testData := append(data, byte(index))
				err := store.SaveFile(cid, testData, meta)
				if err != nil {
					writeErrors <- err
				}
			}(i)
		}

		// Читатели
		for i := 0; i < 5; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				_, _, err := store.GetFile(cid)
				if err != nil {
					readErrors <- err
				}
			}()
		}

		wg.Wait()
		close(readErrors)
		close(writeErrors)

		for err := range readErrors {
			if err != nil {
				t.Errorf("Concurrent read error: %v", err)
			}
		}
		for err := range writeErrors {
			if err != nil {
				t.Errorf("Concurrent write error: %v", err)
			}
		}
	})

	// Тест конкурентного удаления
	t.Run("ConcurrentDelete", func(t *testing.T) {
		var wg sync.WaitGroup
		deleteErrors := make(chan error, 3)

		// Сохраняем файл сначала
		err := store.SaveFile(cid, data, meta)
		if err != nil {
			t.Fatalf("Failed to save file: %v", err)
		}

		// Конкурентное удаление
		for i := 0; i < 3; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				err := store.DeleteFile(cid)
				if err != nil {
					deleteErrors <- err
				}
			}()
		}

		wg.Wait()
		close(deleteErrors)

		errorCount := 0
		for err := range deleteErrors {
			if err != nil {
				errorCount++
			}
		}

		// Только одно удаление должно быть успешным
		if errorCount != 2 {
			t.Errorf("Expected 2 delete errors, got %d", errorCount)
		}
	})
}

func TestExpirationRaceCondition(t *testing.T) {
	store := NewFileStorage("./test_data_expire")
	defer store.Close()

	cid := "expire_test"
	data := []byte("expiring content")
	meta := &models.FileMeta{
		ID:        cid,
		Filename:  "expire.txt",
		Size:      int64(len(data)),
		Hash:      cid,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(100 * time.Millisecond), // Очень короткое время
	}

	// Сохраняем файл
	err := store.SaveFile(cid, data, meta)
	if err != nil {
		t.Fatalf("Failed to save file: %v", err)
	}

	// Пытаемся читать файл пока он не истек
	var wg sync.WaitGroup
	readSuccess := make(chan bool, 10)

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			time.Sleep(50 * time.Millisecond) // Ждем половину времени до экспирации
			_, _, err := store.GetFile(cid)
			readSuccess <- (err == nil)
		}()
	}

	wg.Wait()
	close(readSuccess)

	successCount := 0
	for success := range readSuccess {
		if success {
			successCount++
		}
	}

	if successCount == 0 {
		t.Error("No reads succeeded before expiration")
	}

	// Ждем пока файл точно истечет
	time.Sleep(100 * time.Millisecond)

	// Проверяем что файл удален
	_, _, err = store.GetFile(cid)
	if err == nil {
		t.Error("File should have been expired and deleted")
	}
}

func TestStorageMetrics(t *testing.T) {
	store := NewFileStorage("./test_data_metrics")
	defer store.Close()

	// Сохраняем несколько файлов
	for i := 0; i < 3; i++ {
		cid := string(rune('a' + i))
		data := []byte("test data " + string(rune('a'+i)))
		meta := &models.FileMeta{
			ID:        cid,
			Filename:  "test" + string(rune('a'+i)) + ".txt",
			Size:      int64(len(data)),
			Hash:      cid,
			CreatedAt: time.Now(),
			ExpiresAt: time.Now().Add(time.Hour),
		}
		err := store.SaveFile(cid, data, meta)
		if err != nil {
			t.Fatalf("Failed to save file: %v", err)
		}
	}

	// Даем время для обновления метрик
	time.Sleep(100 * time.Millisecond)

	// Проверяем что метрики обновляются (косвенно через отсутствие паники)
	// В реальном проекте можно добавить методы для получения метрик
}

func TestMultipleFilesConcurrent(t *testing.T) {
	store := NewFileStorage("./test_data_multi")
	defer store.Close()

	var wg sync.WaitGroup
	fileCount := 20
	errors := make(chan error, fileCount*2)

	// Конкурентное сохранение разных файлов
	for i := 0; i < fileCount; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			cid := string(rune('a' + index))
			data := []byte("content for file " + string(rune('a'+index)))
			meta := &models.FileMeta{
				ID:        cid,
				Filename:  "file" + string(rune('a'+index)) + ".txt",
				Size:      int64(len(data)),
				Hash:      cid,
				CreatedAt: time.Now(),
				ExpiresAt: time.Now().Add(time.Hour),
			}
			err := store.SaveFile(cid, data, meta)
			if err != nil {
				errors <- err
			}
		}(i)
	}

	// Конкурентное чтение (некоторые файлы могут еще не существовать)
	for i := 0; i < fileCount; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			cid := string(rune('a' + index))
			_, _, err := store.GetFile(cid)
			// Игнорируем ошибки "файл не найден" - это нормально при конкурентном доступе
			if err != nil && !os.IsNotExist(err) {
				errors <- err
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	for err := range errors {
		if err != nil {
			t.Errorf("Error in concurrent file operations: %v", err)
		}
	}
}
