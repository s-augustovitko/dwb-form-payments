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

    (SELECT COUNT(*) 
     FROM order_items i 
     WHERE o.order_id = o.id AND i.addon_type = 'SESSION'
    ) AS session_count,

    (SELECT COUNT(*) 
     FROM order_items i 
     WHERE o.order_id = o.id AND i.addon_type = 'MEAL'
    ) AS meal_count
FROM submissions s
LEFT JOIN orders o ON s.id = o.submission_id
WHERE s.form_id = ?
ORDER BY o.created_at DESC;
