create table public.admin_invites (
  token_hash text primary key,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id)
);

alter table public.admin_invites enable row level security;

create or replace function public.claim_admin_invite()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  invite_hash text;
begin
  invite_hash := encode(extensions.digest(coalesce(new.raw_user_meta_data->>'admin_invite_token', ''), 'sha256'), 'hex');
  update public.admin_invites
  set used_at = now(), used_by = new.id
  where token_hash = invite_hash
    and used_at is null
    and expires_at > now();

  if found then
    insert into public.admin_users (id) values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created_claim_admin_invite
after insert on auth.users
for each row execute function public.claim_admin_invite();

insert into public.admin_invites (token_hash, expires_at)
values ('8c34843092a3934d6be3b924a4e018842dbae4933469b14f754b132efca31a05', now() + interval '5 minutes');
