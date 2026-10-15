#!/bin/sh
set -eu

if [ "${1:-}" = "apache2-foreground" ]; then
    php /var/www/html/database/apply-schema-migrations.php
fi
exec docker-php-entrypoint "$@"
