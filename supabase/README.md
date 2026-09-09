# RefundRoute Supabase setup

This directory contains the versioned database migrations for a dedicated RefundRoute Supabase project.

1. Create a new Supabase project for RefundRoute. Do not reuse the SANGAJOR project.
2. Open the Supabase SQL Editor.
3. Run the files in `supabase/migrations` in filename order.
4. Create the first application user through Supabase Auth.
5. Promote that user by inserting their Auth user UUID into `public.admin_users` from the SQL Editor.
6. Copy `.env.example` to `.env.local` and add the RefundRoute project values. Never commit `.env.local`.

The migration creates private storage buckets and Row-Level Security policies. Customer files must use the path `user-id/case-id/document-id.ext` so the storage policies can enforce ownership.
