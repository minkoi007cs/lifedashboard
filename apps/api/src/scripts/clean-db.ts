/**
 * Xóa toàn bộ dữ liệu các bảng ld_* (giữ schema), con trước cha theo Foreign Key.
 * Chỉ đụng bảng prefix ld_ — DB Supabase dùng chung với app khác.
 *   DB_SCRIPT_CONFIRM=yes DATABASE_URL=... npm run db:clean
 */
import type { DataSource } from 'typeorm';
import { openScriptDataSource } from './script-datasource';

export async function cleanDb(ds: DataSource): Promise<void> {
  const tables = (
    await ds.query<{ tablename: string }[]>(
      `select tablename from pg_tables where schemaname = 'public' and tablename like 'ld\\_%'`,
    )
  ).map((r) => r.tablename);

  const edges = await ds.query<{ child: string; parent: string }[]>(`
    select ch.relname as child, pa.relname as parent
    from pg_constraint c
    join pg_class ch on ch.oid = c.conrelid
    join pg_class pa on pa.oid = c.confrelid
    where c.contype = 'f' and pa.relname like 'ld\\_%'`);

  const foreign = edges.filter((e) => !e.child.startsWith('ld_'));
  if (foreign.length) {
    throw new Error(
      `Bảng của app khác tham chiếu ld_*: ${foreign.map((e) => `${e.child}->${e.parent}`).join(', ')}. Dừng để tránh xóa lan.`,
    );
  }

  const remaining = new Set(tables);
  while (remaining.size) {
    // Bảng không còn bảng con nào (khác chính nó) chưa bị xóa
    const leaves = [...remaining].filter(
      (t) =>
        !edges.some(
          (e) => e.parent === t && e.child !== t && remaining.has(e.child),
        ),
    );
    if (!leaves.length) {
      throw new Error(`FK cycle: ${[...remaining].join(', ')}`);
    }
    for (const t of leaves) {
      await ds.query(`delete from public."${t}"`);
      console.log(`  cleaned ${t}`);
      remaining.delete(t);
    }
  }
}

if (require.main === module) {
  void (async () => {
    const ds = await openScriptDataSource('db:clean');
    try {
      await cleanDb(ds);
      console.log('[db:clean] done');
    } finally {
      await ds.destroy();
    }
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
