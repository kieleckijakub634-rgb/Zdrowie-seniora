-- The first Supabase Preview run recorded version 20260607 before failing
-- on duplicate migration versions. Keep this no-op migration so the remote
-- preview history remains represented locally. The actual schema changes are
-- applied by the uniquely versioned migrations that follow.
select 1;
