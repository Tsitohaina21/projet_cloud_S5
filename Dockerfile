FROM php:8.2-fpm

# Arguments
ARG user=identityuser
ARG uid=1000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libcurl4-openssl-dev \
    libpq-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql pgsql mbstring exif pcntl bcmath gd curl

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create system user
RUN useradd -G www-data,root -u $uid -d /home/$user $user
RUN mkdir -p /home/$user/.composer && \
    chown -R $user:$user /home/$user

# Set working directory
WORKDIR /var/www

# Copy application files
COPY --chown=$user:$user . /var/www

# Install dependencies (run as root to avoid permission issues writing composer.lock)
RUN composer install --no-interaction --optimize-autoloader

# Ensure files are owned by the non-root user
RUN chown -R $user:$user /var/www || true

# Set permissions
RUN chown -R $user:www-data /var/www/storage /var/www/cache 2>/dev/null || true
RUN chmod -R 775 /var/www/storage /var/www/cache 2>/dev/null || true

USER $user

EXPOSE 9000

CMD ["php-fpm"]