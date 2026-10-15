FROM php:8.3-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends git libpq-dev unzip \
    && docker-php-ext-install pdo_pgsql pgsql opcache \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress \
    && mkdir -p uploads/profile-photos \
    && chown -R www-data:www-data uploads \
    && sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf \
    && sed -i 's/:80>/:10000>/' /etc/apache2/sites-available/000-default.conf

COPY deploy/profconsult.conf /etc/apache2/conf-enabled/profconsult.conf
COPY deploy/php-performance.ini /usr/local/etc/php/conf.d/profconsult.ini
COPY deploy/start.sh /usr/local/bin/profconsult-start
RUN sed -i 's/\r$//' /usr/local/bin/profconsult-start \
    && chmod +x /usr/local/bin/profconsult-start \
    && apache2ctl -t

EXPOSE 10000

ENTRYPOINT ["profconsult-start"]
CMD ["apache2-foreground"]
