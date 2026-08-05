-- Bootstrap invites are operational data, not permanent migration seeds.
delete from public.admin_invites
where expires_at <= now()
  and used_at is null;
