# Dockerfile
FROM php:8.0-apache

# 1. Fix the "Could not reliably determine FQDN" warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# 2. Change Apache to listen on 8080 (Matches your Caddyfile)
RUN sed -i 's/Listen 80/Listen 8080/g' /etc/apache2/ports.conf && \
    sed -i 's/:80/:8080/g' /etc/apache2/sites-available/000-default.conf

# Install PDO MySQL driver
RUN docker-php-ext-install pdo pdo_mysql

# (optional but recommended)
RUN docker-php-ext-enable pdo_mysql

# Enable mod_rewrite
RUN a2enmod rewrite

