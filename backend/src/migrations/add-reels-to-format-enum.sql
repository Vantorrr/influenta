-- Add 'reels' value to listings_format_enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'reels' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listings_format_enum')
  ) THEN
    ALTER TYPE listings_format_enum ADD VALUE 'reels';
  END IF;
END
$$;










