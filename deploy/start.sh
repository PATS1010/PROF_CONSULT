#!/bin/sh
set -eu

if [ "${1:-}" = "apache2-foreground" ]; then
    php /var/www/html/database/migrate.php
fi
exec docker-php-entrypoint "$@"
