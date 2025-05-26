CREATE OR REPLACE FUNCTION search_sim_cards(
    search_term TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    team_id_param UUID DEFAULT NULL,
    from_date TIMESTAMP DEFAULT NULL,
    to_date TIMESTAMP DEFAULT NULL
)
RETURNS SETOF sim_cards
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.*
    FROM 
        sim_cards sc
    LEFT JOIN 
        users u ON sc.assigned_to_user_id = u.id
    LEFT JOIN 
        users reg_user ON sc.registered_by_user_id = reg_user.id
    WHERE 
        (search_term IS NULL OR 
         sc.serial_number ILIKE '%' || search_term || '%' OR)
        AND (status_filter IS NULL OR sc.status = status_filter)
        AND (team_id_param IS NULL OR sc.team_id = team_id_param)
        AND (from_date IS NULL OR sc.created_at >= from_date)
        AND (to_date IS NULL OR sc.created_at <= to_date)
    ORDER BY 
        sc.created_at DESC;
END;
$$;
