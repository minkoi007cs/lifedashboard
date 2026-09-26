/**
 * Sinh dữ liệu giả cho môi trường mới: 2 user demo + tasks, habits (+30 ngày log),
 * focus sessions, ví/danh mục/giao dịch tài chính.
 *   DB_SCRIPT_CONFIRM=yes DATABASE_URL=... npm run db:seed
 */
import { addDays, format, subDays } from 'date-fns';
import { openScriptDataSource } from './script-datasource';
import { User } from '../users/user.entity';
import { Task, TaskPriority, TaskStatus } from '../tasks/task.entity';
import { Habit, HabitLog } from '../habits/habit.entity';
import { FocusSession } from '../focus/focus.entity';
import { FinanceWallet } from '../finance/entities/finance-wallet.entity';
import { FinanceCategory } from '../finance/entities/finance-category.entity';
import { FinanceTransaction } from '../finance/entities/finance-transaction.entity';

const day = (d: Date) => format(d, 'yyyy-MM-dd');

async function run() {
  const ds = await openScriptDataSource('db:seed');
  const today = new Date();
  try {
    const users = ds.getRepository(User);
    const demoUsers: User[] = [];
    for (const [email, name, role] of [
      ['demo@lifedashboard.local', 'Demo Admin', 'admin'],
      ['friend@lifedashboard.local', 'Demo Friend', 'user'],
    ] as const) {
      demoUsers.push(
        (await users.findOneBy({ email })) ??
          (await users.save(users.create({ email, name, role }))),
      );
    }

    for (const { id: userId } of demoUsers) {
      const statuses = [TaskStatus.TODO, TaskStatus.DOING, TaskStatus.DONE];
      const priorities = [
        TaskPriority.LOW,
        TaskPriority.MEDIUM,
        TaskPriority.HIGH,
      ];
      await ds.getRepository(Task).save(
        Array.from({ length: 12 }, (_, i) => ({
          userId,
          title: `Công việc mẫu #${i + 1}`,
          description: 'Dữ liệu seed',
          status: statuses[i % 3],
          priority: priorities[i % 3],
          dueDate: addDays(today, i - 4),
        })),
      );

      const habits = await ds.getRepository(Habit).save(
        ['Uống 2L nước', 'Đọc sách 20 phút', 'Tập thể dục'].map((name) => ({
          userId,
          name,
          frequencyType: 'daily',
          targetCount: 1,
          startDate: day(subDays(today, 30)),
        })),
      );
      await ds.getRepository(HabitLog).save(
        habits.flatMap((habit, h) =>
          Array.from({ length: 30 }, (_, i) => {
            const done = (i + h) % 4 !== 0;
            return {
              habitId: habit.id,
              date: day(subDays(today, i)),
              completedCount: done ? 1 : 0,
              isCompleted: done,
            };
          }),
        ),
      );

      await ds.getRepository(FocusSession).save(
        Array.from({ length: 14 }, (_, i) => {
          const start = subDays(today, i);
          start.setHours(9, 0, 0, 0);
          return {
            userId,
            startTime: start,
            endTime: new Date(start.getTime() + 25 * 60_000),
            durationMinutes: 25,
            label: i % 2 ? 'Study' : 'Work',
          };
        }),
      );

      const wallet = await ds.getRepository(FinanceWallet).save({
        userId,
        name: 'Ví tiền mặt',
        type: 'cash' as const,
        balance: 5_000_000,
      });
      const [salary, food, transport] = await ds
        .getRepository(FinanceCategory)
        .save([
          { userId, name: 'Lương', type: 'income' as const, color: '#16a34a' },
          {
            userId,
            name: 'Ăn uống',
            type: 'expense' as const,
            color: '#ea580c',
          },
          {
            userId,
            name: 'Đi lại',
            type: 'expense' as const,
            color: '#2563eb',
          },
        ]);
      await ds.getRepository(FinanceTransaction).save([
        {
          userId,
          walletId: wallet.id,
          categoryId: salary.id,
          type: 'income' as const,
          amount: 15_000_000,
          date: day(subDays(today, 25)),
          note: 'Lương tháng',
        },
        ...Array.from({ length: 20 }, (_, i) => ({
          userId,
          walletId: wallet.id,
          categoryId: i % 3 ? food.id : transport.id,
          type: 'expense' as const,
          amount: 30_000 + ((i * 17_000) % 150_000),
          date: day(subDays(today, i)),
          note: i % 3 ? 'Ăn trưa' : 'Grab',
        })),
      ]);
    }
    console.log(
      `[db:seed] done — users: ${demoUsers.map((u) => u.email).join(', ')}`,
    );
  } finally {
    await ds.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
