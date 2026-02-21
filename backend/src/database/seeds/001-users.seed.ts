import { QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export interface UserIds {
  admin: string;
  operator: string;
  inspector: string;
  manager: string;
  finance: string;
}

export async function seedUsers(queryRunner: QueryRunner): Promise<UserIds> {
  const password = await bcrypt.hash('Admin123!', 10);

  const users = [
    { name: 'System Admin', email: 'admin@ast.nl', role: 'admin' },
    { name: 'Scale Operator', email: 'operator@ast.nl', role: 'scale_operator' },
    { name: 'Quality Inspector', email: 'inspector@ast.nl', role: 'quality_inspector' },
    { name: 'Operations Manager', email: 'manager@ast.nl', role: 'operations_manager' },
    { name: 'Finance Admin', email: 'finance@ast.nl', role: 'finance' },
  ];

  const ids: Record<string, string> = {};
  const keys = ['admin', 'operator', 'inspector', 'manager', 'finance'];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const result = await queryRunner.query(
      `INSERT INTO "users" ("name", "email", "password", "role", "active")
       VALUES ($1, $2, $3, $4::user_role_enum, true)
       RETURNING "id"`,
      [user.name, user.email, password, user.role],
    );
    ids[keys[i]] = result[0].id;
    console.log(`  Seeded user: ${user.email} (${user.role})`);
  }

  return ids as unknown as UserIds;
}
