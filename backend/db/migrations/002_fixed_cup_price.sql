BEGIN;

-- Seguridad: solo migrar si aún no hay ventas registradas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM sale_items) THEN
        RAISE EXCEPTION 'Ya existen ventas registradas; migrar los datos manualmente';
    END IF;
END $$;

-- 1. Configuración de la aplicación (precio por vaso)
CREATE TABLE app_settings (
    key         VARCHAR(50)  PRIMARY KEY,
    value       TEXT         NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
INSERT INTO app_settings (key, value) VALUES ('cup_price', '2.00');

-- 2. Quitar la vista dependiente antes de modificar tablas
DROP VIEW IF EXISTS v_sales_day_by_flavor;

-- 3. El precio ya no vive en el sabor
ALTER TABLE flavors DROP COLUMN price;

-- 4. sale_items pasa a representar "vasos" (quantity vasos idénticos)
ALTER TABLE sale_items DROP COLUMN flavor_id;

-- 5. Sabores que contiene cada vaso (1 sabor = vaso simple; 2+ = surtido)
CREATE TABLE sale_item_flavors (
    sale_item_id  BIGINT NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
    flavor_id     BIGINT NOT NULL REFERENCES flavors(id),
    PRIMARY KEY (sale_item_id, flavor_id)
);
CREATE INDEX idx_sale_item_flavors_flavor ON sale_item_flavors (flavor_id);

-- 6. Ventas por sabor del día.
--    "cups" cuenta los vasos en que aparece el sabor (un surtido cuenta para cada sabor).
--    "attributed_revenue" reparte el subtotal en partes iguales entre los sabores del vaso.
CREATE VIEW v_sales_day_by_flavor AS
SELECT
    s.sales_day_id,
    f.id    AS flavor_id,
    f.name  AS flavor_name,
    f.color,
    f.icon,
    SUM(si.quantity)                          AS cups,
    ROUND(SUM(si.subtotal / fc.flavor_count), 2) AS attributed_revenue
FROM sale_items si
JOIN sales s              ON s.id = si.sale_id
JOIN sale_item_flavors sif ON sif.sale_item_id = si.id
JOIN flavors f            ON f.id = sif.flavor_id
JOIN (
    SELECT sale_item_id, COUNT(*) AS flavor_count
    FROM sale_item_flavors GROUP BY sale_item_id
) fc ON fc.sale_item_id = si.id
GROUP BY s.sales_day_id, f.id, f.name, f.color, f.icon;

-- 7. El cierre automático debe registrar la hora exacta de las 00:00 (Lima)
--    del día siguiente, no el momento en que se ejecutó la función.
CREATE OR REPLACE FUNCTION close_overdue_sales_days() RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE sales_days
       SET status    = 'closed',
           closed_at = ((sale_date + 1)::timestamp AT TIME ZONE 'America/Lima'),
           closed_by = 'auto'
     WHERE status = 'open'
       AND sale_date < today_lima();
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;
