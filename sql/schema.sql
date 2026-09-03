-- ========================================================================
-- Smart Logistics & Delivery Intelligent Decision Support System (IDSS)
-- MySQL Relational Database Schema & Seeding Script
-- Target Engine: MySQL 8.0+ / InnoDB / utf8mb4
-- Locale: Sri Lanka (Western Province logistics network, LKR currency)
-- ========================================================================

DROP DATABASE IF EXISTS smart_logistics_idss;
CREATE DATABASE smart_logistics_idss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_logistics_idss;

-- 1. Locations (Warehouses, Ports, Distribution Centers, Hubs, Customer Nodes)
CREATE TABLE locations (
    location_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type ENUM('warehouse', 'distribution_center', 'retail_hub', 'customer', 'port') NOT NULL,
    coord_x INT NOT NULL,
    coord_y INT NOT NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    capacity INT NULL,
    inventory_count INT NULL,
    demand INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Routes (Graph Adjacency Road Segments)
CREATE TABLE routes (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    source_location_id VARCHAR(32) NOT NULL,
    destination_location_id VARCHAR(32) NOT NULL,
    distance_km DECIMAL(8, 2) NOT NULL,
    travel_time_minutes INT NOT NULL,
    travel_cost_lkr DECIMAL(10, 2) NOT NULL,
    traffic_multiplier DECIMAL(4, 2) DEFAULT 1.00,
    is_blocked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (source_location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    FOREIGN KEY (destination_location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    INDEX idx_route_source (source_location_id),
    INDEX idx_route_dest (destination_location_id)
) ENGINE=InnoDB;

-- 3. Vehicles (Fleet Assets)
CREATE TABLE vehicles (
    vehicle_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type ENUM('Van', 'Truck', 'Electric_Cargo_Bike', 'Heavy_Lorry') NOT NULL,
    capacity_kg DECIMAL(10, 2) NOT NULL,
    volume_m3 DECIMAL(8, 2) NOT NULL,
    cost_per_km DECIMAL(8, 2) NOT NULL,
    avg_speed_kmh INT NOT NULL,
    current_location_id VARCHAR(32) NOT NULL,
    status ENUM('available', 'in_transit', 'maintenance') DEFAULT 'available',
    FOREIGN KEY (current_location_id) REFERENCES locations(location_id)
) ENGINE=InnoDB;

-- 4. Drivers (Staff Roster & Compliance)
CREATE TABLE drivers (
    driver_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    experience_years INT NOT NULL,
    rating DECIMAL(3, 2) NOT NULL,
    max_shift_hours INT NOT NULL DEFAULT 8,
    hours_worked_today DECIMAL(4, 2) DEFAULT 0.00,
    cost_per_hour DECIMAL(8, 2) NOT NULL,
    assigned_vehicle_id VARCHAR(32) NULL,
    status ENUM('available', 'on_duty', 'off_duty') DEFAULT 'available',
    FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Orders (Customer Consignments & SLAs)
CREATE TABLE orders (
    order_id VARCHAR(32) PRIMARY KEY,
    tracking_number VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(128) NOT NULL,
    pickup_location_id VARCHAR(32) NOT NULL,
    destination_location_id VARCHAR(32) NOT NULL,
    weight_kg DECIMAL(8, 2) NOT NULL,
    volume_m3 DECIMAL(6, 2) NOT NULL,
    deadline_hours DECIMAL(4, 2) NOT NULL,
    customer_tier ENUM('Platinum', 'Gold', 'Standard') NOT NULL,
    item_value_lkr DECIMAL(12, 2) NOT NULL,
    is_perishable BOOLEAN DEFAULT FALSE,
    fragility ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
    assigned_driver_id VARCHAR(32) NULL,
    assigned_vehicle_id VARCHAR(32) NULL,
    status ENUM('pending', 'allocated', 'in_transit', 'delivered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pickup_location_id) REFERENCES locations(location_id),
    FOREIGN KEY (destination_location_id) REFERENCES locations(location_id),
    FOREIGN KEY (assigned_driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
    INDEX idx_order_priority (customer_tier, deadline_hours)
) ENGINE=InnoDB;

-- 6. Inventory (Warehouse Stock & SKU Catalog)
CREATE TABLE inventory (
    inventory_id VARCHAR(32) PRIMARY KEY,
    warehouse_id VARCHAR(32) NOT NULL,
    product_name VARCHAR(128) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    category ENUM('Pharmaceutical', 'Electronics', 'Perishables', 'General Freight', 'Hardware') NOT NULL,
    quantity INT NOT NULL,
    reorder_level INT NOT NULL,
    unit_value_lkr DECIMAL(10, 2) NOT NULL,
    weight_per_unit_kg DECIMAL(6, 2) NOT NULL,
    last_restock_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    INDEX idx_inventory_sku (sku)
) ENGINE=InnoDB;

-- ========================================================================
-- Seed Initial Logistics Master Data — Colombo Metro Region, Sri Lanka
-- ========================================================================
INSERT INTO locations (location_id, name, type, coord_x, coord_y, latitude, longitude, capacity, inventory_count, demand) VALUES
('W1', 'Colombo Central Mega Warehouse (W1)', 'warehouse', 200, 180, 6.9271000, 79.8612000, 50000, 42000, NULL),
('W2', 'Colombo Port Warehouse (W2)', 'port', 220, 480, 6.9430000, 79.8430000, 60000, 51000, NULL),
('DC1', 'Katunayake Distribution Center (DC1)', 'distribution_center', 450, 120, 7.1697000, 79.8842000, 20000, 16500, NULL),
('DC2', 'Kelaniya Cross-Dock (DC2)', 'distribution_center', 480, 300, 6.9553000, 79.9217000, 25000, 21000, NULL),
('DC3', 'Bandaranaike Airport Cargo Terminal (DC3)', 'distribution_center', 490, 490, 7.1808000, 79.8841000, 30000, 28000, NULL),
('HUB1', 'Gampaha Express Hub (HUB1)', 'retail_hub', 700, 100, 7.0917000, 80.0000000, NULL, NULL, 4200),
('HUB2', 'Nugegoda Retail Center (HUB2)', 'retail_hub', 740, 260, 6.8649000, 79.8997000, NULL, NULL, 6800),
('HUB3', 'Moratuwa Fulfillment Hub (HUB3)', 'retail_hub', 750, 420, 6.7730000, 79.8816000, NULL, NULL, 3900),
('C1', 'Malabe Tech Park Enterprise (C1)', 'customer', 880, 80, 6.9066000, 79.9639000, NULL, NULL, 850),
('C2', 'Borella Medical District Hospital (C2)', 'customer', 920, 220, 6.9147000, 79.8774000, NULL, NULL, 1200),
('C3', 'Kaduwela Superstore (C3)', 'customer', 910, 360, 6.9333000, 79.9833000, NULL, NULL, 1600),
('C4', 'Kalutara Gateway Mall (C4)', 'customer', 890, 520, 6.5854000, 79.9607000, NULL, NULL, 2100);

INSERT INTO routes (source_location_id, destination_location_id, distance_km, travel_time_minutes, travel_cost_lkr) VALUES
('W1', 'DC1', 32.5, 45, 3600),
('W1', 'DC2', 10.2, 22, 1500),
('W1', 'W2', 6.0, 15, 900),
('W2', 'DC2', 12.4, 26, 1750),
('W2', 'DC3', 35.0, 48, 3900),
('DC1', 'DC2', 24.0, 34, 2600),
('DC2', 'DC3', 30.5, 42, 3300),
('DC1', 'HUB1', 12.6, 20, 1450),
('DC1', 'HUB2', 38.4, 55, 4100),
('DC2', 'HUB1', 22.5, 32, 2450),
('DC2', 'HUB2', 8.8, 18, 1250),
('DC2', 'HUB3', 15.6, 25, 1750),
('DC3', 'HUB2', 41.0, 58, 4400),
('DC3', 'HUB3', 34.0, 47, 3700),
('HUB1', 'HUB2', 18.2, 27, 2000),
('HUB2', 'HUB3', 9.4, 17, 1300),
('HUB1', 'C1', 14.8, 23, 1600),
('HUB1', 'C2', 26.3, 35, 2850),
('HUB2', 'C2', 7.5, 15, 1100),
('HUB2', 'C3', 9.6, 18, 1350),
('HUB3', 'C3', 20.1, 30, 2200),
('HUB3', 'C4', 16.2, 24, 1800),
('DC3', 'C4', 46.5, 62, 4900);

INSERT INTO vehicles (vehicle_id, name, type, capacity_kg, volume_m3, cost_per_km, avg_speed_kmh, current_location_id, status) VALUES
('V-101', 'Tata Ace Mini Truck #1', 'Van', 1200, 11.5, 95, 40, 'W1', 'available'),
('V-102', 'Toyota Dyna Van #2', 'Van', 1100, 10.0, 78, 42, 'DC1', 'available'),
('V-103', 'Ashok Leyland Medium Truck #1', 'Truck', 4500, 32.0, 165, 50, 'W1', 'available'),
('V-104', 'Tata LPT Heavy Truck #2', 'Truck', 8000, 54.0, 220, 48, 'W2', 'available'),
('V-105', 'Bajaj Maxima Cargo Three-Wheeler #1', 'Electric_Cargo_Bike', 180, 1.8, 22, 28, 'HUB2', 'available'),
('V-106', 'TVS King Cargo Three-Wheeler #2', 'Electric_Cargo_Bike', 200, 2.0, 24, 26, 'HUB1', 'available'),
('V-107', 'Lanka Ashok Leyland Heavy Lorry #1', 'Heavy_Lorry', 18000, 90.0, 310, 55, 'W2', 'available');

INSERT INTO drivers (driver_id, name, experience_years, rating, max_shift_hours, hours_worked_today, cost_per_hour, status) VALUES
('DR-01', 'Kasun Perera', 8, 4.90, 8, 1.5, 950, 'available'),
('DR-02', 'Nadeesha Fernando', 5, 4.80, 8, 3.0, 820, 'available'),
('DR-03', 'Sampath Wickramasinghe', 12, 5.00, 9, 0.0, 1050, 'available'),
('DR-04', 'Ishara Jayasuriya', 4, 4.70, 8, 2.5, 740, 'available'),
('DR-05', 'Roshan Bandara', 2, 4.50, 7, 1.0, 620, 'available'),
('DR-06', 'Chathurika Silva', 7, 4.90, 8, 4.0, 880, 'available');

INSERT INTO orders (order_id, tracking_number, customer_name, pickup_location_id, destination_location_id, weight_kg, volume_m3, deadline_hours, customer_tier, item_value_lkr, is_perishable, fragility, status) VALUES
('ORD-801', 'SL-7821-X', 'Nawaloka Diagnostic Labs', 'W1', 'C2', 140, 1.2, 2.0, 'Platinum', 4350000, TRUE, 'High', 'pending'),
('ORD-802', 'SL-9932-A', 'Malabe Data Cloud Campus', 'W1', 'C1', 480, 4.5, 4.0, 'Platinum', 8400000, FALSE, 'High', 'pending'),
('ORD-803', 'SL-4112-B', 'Cargills Food City - Kaduwela', 'W2', 'C3', 1850, 14.0, 6.0, 'Gold', 2520000, TRUE, 'Medium', 'pending'),
('ORD-804', 'SL-5519-C', 'Arpico Supercentre - Kalutara', 'W2', 'C4', 2400, 18.2, 8.0, 'Gold', 3660000, FALSE, 'Low', 'pending'),
('ORD-805', 'SL-2291-D', 'Gampaha Boutique Plaza', 'DC1', 'HUB1', 95, 0.8, 3.0, 'Gold', 1290000, FALSE, 'Medium', 'pending'),
('ORD-806', 'SL-6631-E', 'Osu Sala Pharmacy Chain', 'DC2', 'C2', 65, 0.5, 1.5, 'Platinum', 2760000, TRUE, 'High', 'pending'),
('ORD-807', 'SL-3104-F', 'Cinnamon Grand Colombo Banquet', 'W1', 'HUB2', 620, 5.2, 5.0, 'Standard', 1170000, TRUE, 'Medium', 'pending'),
('ORD-808', 'SL-1940-G', 'Colombo Industrial Components Ltd', 'DC3', 'C4', 3100, 22.0, 12.0, 'Standard', 4950000, FALSE, 'Low', 'pending'),
('ORD-809', 'SL-8842-H', 'Malabe Tech Innovate Studio', 'HUB1', 'C1', 35, 0.3, 2.5, 'Gold', 2130000, FALSE, 'High', 'pending'),
('ORD-810', 'SL-9011-J', 'Kandy Hardware Distributors Co.', 'W2', 'HUB3', 1450, 9.8, 9.0, 'Standard', 1530000, FALSE, 'Low', 'pending');

INSERT INTO inventory (inventory_id, warehouse_id, product_name, sku, category, quantity, reorder_level, unit_value_lkr, weight_per_unit_kg) VALUES
('INV-101', 'W1', 'Vaccine Cryo-Storage Vial Units', 'MED-VAC-99', 'Pharmaceutical', 2400, 500, 36000, 0.25),
('INV-102', 'W1', 'NVMe Solid-State Storage Arrays', 'TECH-SSD-4TB', 'Electronics', 850, 200, 102000, 0.60),
('INV-103', 'W2', 'Industrial Automation Actuators', 'IND-ACT-40', 'Hardware', 420, 100, 267000, 14.50),
('INV-104', 'W2', 'Premium Ceylon Organic Produce Crates', 'AGRI-ORG-CR', 'Perishables', 1250, 300, 13500, 18.00),
('INV-105', 'DC1', 'Emergency Medical PPE Kits', 'MED-PPE-K1', 'Pharmaceutical', 3600, 800, 8400, 1.10),
('INV-106', 'DC2', 'High-Density Server Motherboards', 'TECH-MB-PRO', 'Electronics', 310, 75, 186000, 2.30),
('INV-107', 'DC3', 'Lithium Iron Phosphate Battery Packs', 'ENG-BAT-LFP', 'General Freight', 640, 150, 144000, 22.00);
