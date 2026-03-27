# Dockerfile
FROM php:8.2-apache

# Install PDO MySQL driver
RUN docker-php-ext-install pdo pdo_mysql

# (optional but recommended)
RUN docker-php-ext-enable pdo_mysql

# Enable mod_rewrite
RUN a2enmod rewrite

