-- Allow normal website users to have a dedicated client role.
alter type public.user_role add value if not exists 'client';
