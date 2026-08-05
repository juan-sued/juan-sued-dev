create unique index opportunities_one_per_contact_idx
  on public.opportunities(contact_id)
  where contact_id is not null;
