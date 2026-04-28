-- Unlock Process and Equipment labels from system-managed (dept) to
-- user-editable (custom). These were auto-seeded as department labels
-- but should be freely editable by company admins.
--
-- Effect: removes the lock badge in the Labels manager, allows rename,
-- recolor, archive, and delete (once usage reaches 0).

UPDATE public.tags
SET
  source        = 'custom',
  department_id = NULL
WHERE
  name_en IN ('Process', 'Equipment')
  AND source = 'department';
