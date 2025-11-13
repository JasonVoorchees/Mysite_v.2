# Сборка TrezoApp для Windows

Ниже приведён минимальный набор шагов, чтобы собрать автономный `.exe` и запустить приложение на Windows 10/11 (x64).

## 1. Подготовка окружения
1. Установите [Python 3.11.x](https://www.python.org/downloads/windows/) (галочка «Add Python to PATH» должна быть включена).
2. Склонируйте репозиторий и откройте терминал в каталоге `desktop_app`.
3. Создайте виртуальное окружение:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
4. Установите зависимости проекта:
   ```powershell
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
5. Установите PyInstaller (он не входит в requirements по умолчанию):
   ```powershell
   pip install pyinstaller
   ```

## 2. Подготовка ресурсов
Qt-проекты нуждаются в статичных ресурсах (стили, иконки). Перед сборкой убедитесь, что каталог `resources/` содержит нужные файлы (входит в репозиторий).

## 3. Сборка исполняемого файла
Запустите PyInstaller из активированного окружения:
```powershell
pyinstaller --noconsole --name TrezoApp \
  --add-data "resources;resources" \
  app/main.py
```
Объяснение ключей:
- `--noconsole` скрывает консольное окно.
- `--add-data "resources;resources"` добавляет папку ресурсов в финальный пакет (используйте `:` вместо `;` в WSL/Linux).
- `app/main.py` — точка входа.

После завершения сборки исполняемый файл появится в каталоге `dist/TrezoApp/`. Туда же PyInstaller скопирует все необходимые `.dll` и ресурсы.

## 4. Запуск и распространение
1. Перейдите в папку `dist/TrezoApp`:
   ```powershell
   cd dist/TrezoApp
   ```
2. Запустите приложение двойным кликом по `TrezoApp.exe` или из PowerShell:
   ```powershell
   .\TrezoApp.exe
   ```
3. Для переноса на другую машину скопируйте всю папку `TrezoApp` (включая подпапки `resources`). Дополнительная установка не требуется — приложение хранит данные в `%APPDATA%/TrezoApp`.

## 5. Дополнительные команды
- Обновить зависимости: `pip install --upgrade -r requirements.txt`
- Очистить сборку: удалить каталоги `build/`, `dist/` и файл `TrezoApp.spec`.

Этих шагов достаточно, чтобы повторить сборку на чистой системе Windows.
