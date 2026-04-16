-- name: GetSubmissionsReport :many
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.email,
    s.id_type,
    s.id_value,
    s.country_code,
    s.phone,

    o.status,
    o.amount,
    o.currency,
    o.event_type,
    o.meal_type,
    o.created_at,

    COALESCE(counts.session_count, 0) AS session_count,
    COALESCE(counts.meal_count, 0) AS meal_count
FROM submissions s
JOIN orders o ON s.id = o.submission_id AND o.status IN (sqlc.slice('status'))
LEFT JOIN (
    SELECT order_id,
           COALESCE(CAST(SUM(CASE WHEN addon_type = 'SESSION' THEN 1 ELSE 0 END) AS SIGNED), 0) AS session_count,
           COALESCE(CAST(SUM(CASE WHEN addon_type = 'MEAL' THEN 1 ELSE 0 END) AS SIGNED), 0) AS meal_count
    FROM order_items
    WHERE addon_type IN ('SESSION', 'MEAL')
    GROUP BY order_id
) counts ON counts.order_id = o.id
WHERE s.form_id IN (sqlc.slice('ids'))
ORDER BY o.created_at DESC;
