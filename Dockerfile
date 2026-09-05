# Use the official PHP 8.3 image that already includes Apache.
FROM php:8.3-apache

# Update package lists, install tools needed for Composer/PostgreSQL, enable PHP PostgreSQL extensions,
# enable Apache rewrite rules, then remove package cache to keep the image smaller.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        libpq-dev \
        unzip \
    && docker-php-ext-install pdo_pgsql pgsql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Copy the Composer executable from the official Composer image into this PHP image.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set the app folder inside the container.
WORKDIR /var/www/html

# Copy Composer files first so Docker can cache dependency installation when app code changes.
COPY composer.json composer.lock ./

# Install PHP dependencies without development packages and optimize Composer autoloading.
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Copy the rest of the Prof Consult project into the container.
COPY . .

# Give Apache's www-data user ownership of uploaded files.
RUN chown -R www-data:www-data /var/www/html/uploads

# Document that the container listens on HTTP port 80.
EXPOSE 80
