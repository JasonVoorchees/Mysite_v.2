# Trezo

## Прод-запуск

1. Отредактируйте `.env.prod`, заменив плейсхолдеры на боевые значения (секретный ключ, домены, доступы к БД и т.д.).
2. Поднимите прод-стек Docker:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```
3. Выполните миграции базы данных:
   ```bash
   docker compose -f docker-compose.prod.yml exec web python manage.py migrate
   ```
4. Соберите статические файлы Django:
   ```bash
   docker compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
   ```
5. Проверьте конфигурацию Nginx:
   ```bash
   docker compose -f docker-compose.prod.yml exec nginx nginx -t
   ```

> При необходимости заполните блоки S3/MinIO и почтовых параметров в `.env.prod`.
