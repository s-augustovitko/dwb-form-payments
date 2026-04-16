-- name: DashboardListForms :many
SELECT
    id,
    title
FROM forms
WHERE active = true AND end_date >= DATE_SUB(UTC_DATE(), INTERVAL 12 MONTH)
ORDER BY end_date DESC
LIMIT ?;

-- name: DashboardFormOrders :many
SELECT
    o.currency currency,
    COUNT(DISTINCT f.id) form_count,
    COUNT(DISTINCT o.id) order_count,
    COALESCE(CAST(SUM(CASE WHEN o.status = 'CONFIRMED' THEN o.amount ELSE 0 END) AS DECIMAL(10,2)), 0) revenue,
    COALESCE(CAST(SUM(CASE WHEN o.status = 'DRAFT' THEN 1 ELSE 0 END) AS SIGNED), 0) draft_count,
    COALESCE(CAST(SUM(CASE WHEN o.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS SIGNED), 0) confirmed_count,
    COALESCE(CAST(SUM(CASE WHEN o.status = 'CANCELLED' THEN 1 ELSE 0 END) AS SIGNED), 0) cancelled_count,
    COALESCE(CAST(SUM(CASE WHEN o.status = 'ON_SITE' THEN 1 ELSE 0 END) AS SIGNED), 0) on_site_count
FROM forms f
JOIN orders o ON o.form_id = f.id AND o.status IN (sqlc.slice('status'))
WHERE f.id IN (sqlc.slice('ids'))
GROUP BY o.currency;

-- name: DashboardAddons :many
SELECT
    a.id,
    a.title,
    a.addon_type,
    a.price,
    a.currency,
    a.date_time,
    COUNT(oi.id) AS order_count
FROM addons a
LEFT JOIN order_items oi ON oi.addon_id = a.id
WHERE a.form_id IN (sqlc.slice('ids')) AND a.active = TRUE
GROUP BY a.id
ORDER BY a.form_id, a.sort_order ASC;

-- name: DashboardSubmissions :many
SELECT
    s.first_name,
    s.last_name,
    s.created_at,
    f.title,
    o.status
FROM submissions s
JOIN forms f ON f.id = s.form_id
JOIN orders o ON o.submission_id = s.id AND o.status IN (sqlc.slice('status'))
WHERE f.id IN (sqlc.slice('ids'))
ORDER BY s.created_at DESC
LIMIT 10;

