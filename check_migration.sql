-- Check if storage_connections table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'storage_connections'
) as table_exists;

-- Check if columns exist in project_files
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'project_files' 
  AND column_name IN ('storage_provider', 'external_file_id', 'external_metadata');
