-- MySQL 8.0.16+ --

CREATE DATABASE IF NOT EXISTS partners_db
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
USE partners_db;

DROP TABLE IF EXISTS delivery_items, deliveries, products, partners, product_types, partner_types;

CREATE TABLE partner_types (
  partner_type_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(50)  NOT NULL,

  CONSTRAINT uq_partner_types_name UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE partners (
  partner_id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  partner_type_id INT UNSIGNED NOT NULL,
  name            VARCHAR(255) NOT NULL,
  director_name   VARCHAR(255),
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  inn             VARCHAR(12)  NOT NULL,
  legal_address   VARCHAR(500),
  rating          DECIMAL(3,1),

  CONSTRAINT uq_partners_email UNIQUE (email),
  CONSTRAINT uq_partners_inn   UNIQUE (inn),
  CONSTRAINT fk_partners_type  FOREIGN KEY (partner_type_id)
        REFERENCES partner_types (partner_type_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_partners_rating CHECK (rating BETWEEN 0 AND 10)
) ENGINE=InnoDB;

CREATE TABLE product_types (
  product_type_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  coefficient     DECIMAL(5,2),

  CONSTRAINT uq_product_types_name UNIQUE (name),
  CONSTRAINT chk_product_types_coef CHECK (coefficient > 0)
) ENGINE=InnoDB;

CREATE TABLE products (
  product_id      INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_type_id INT UNSIGNED  NOT NULL,
  article         VARCHAR(50),
  name            VARCHAR(255)  NOT NULL,
  unit_price      DECIMAL(12,2),

  CONSTRAINT uq_products_article UNIQUE (article),
  CONSTRAINT uq_products_name    UNIQUE (name),
  CONSTRAINT fk_products_type    FOREIGN KEY (product_type_id)
        REFERENCES product_types (product_type_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_products_price CHECK (unit_price >= 0)
) ENGINE=InnoDB;

CREATE TABLE deliveries (
  delivery_id   INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  partner_id    INT UNSIGNED NOT NULL,
  delivery_date DATE         NOT NULL,

  CONSTRAINT fk_deliveries_partner FOREIGN KEY (partner_id)
        REFERENCES partners (partner_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE delivery_items (
  item_id           INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  delivery_id       INT UNSIGNED  NOT NULL,
  product_id        INT UNSIGNED  NOT NULL,
  quantity          INT UNSIGNED  NOT NULL,
  price_at_delivery DECIMAL(12,2) NOT NULL,

  CONSTRAINT fk_items_delivery FOREIGN KEY (delivery_id)
        REFERENCES deliveries (delivery_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_items_product  FOREIGN KEY (product_id)
        REFERENCES products (product_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_items_price    CHECK (price_at_delivery >= 0),

  INDEX idx_items_delivery (delivery_id),
  INDEX idx_items_product  (product_id)
) ENGINE=InnoDB;