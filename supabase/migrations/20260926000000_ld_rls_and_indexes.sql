-- LifeDashboard: bật RLS + index cho mọi bảng ld_* trên Supabase dùng chung.
--
-- Vì sao RLS không policy là đúng ở đây: app KHÔNG gọi Supabase từ browser; API NestJS
-- kết nối bằng DATABASE_URL (role postgres = owner bảng, bypass RLS). Bật RLS không policy
-- => chặn mọi truy cập ld_* qua PostgREST bằng anon key (anon key dùng chung với app khác).
--
-- Kiểm tra sau khi chạy:
--   select tablename, rowsecurity from pg_tables where schemaname='public' and tablename like 'ld\_%';

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename like 'ld\_%' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- Index cho cột lọc chính (mọi truy vấn đều where "userId" = ...)
  for t in
    select c.table_name from information_schema.columns c
    where c.table_schema = 'public' and c.table_name like 'ld\_%' and c.column_name = 'userId'
  loop
    execute format('create index if not exists %I on public.%I ("userId")', t || '_user_id_idx', t);
  end loop;
end $$;

create index if not exists ld_habit_logs_habit_id_date_idx on public.ld_habit_logs ("habitId", date);
