/**
 * drizzle 是一个函数，用来创建 ORM 实例。
* drizzle-orm/postgres-js 表示用 postgres-js 这个驱动来连接 PostgreSQL。
* ORM 是什么：Object-Relational Mapping，让你用 TypeScript 代码操作数据库，不用手写 SQL。比如 db.select().from(tasks) 就等价于 SELECT * FROM tasks
 */
import { drizzle } from 'drizzle-orm/postgres-js';
/**
 * postgres 是底层的数据库驱动，负责真正和 PostgreSQL 建立 TCP 连接、发送 SQL。
 *它是纯 JavaScript 实现，性能好，支持连接池。
 * Drizzle 本身不直接连数据库，它需要依赖一个驱动，postgres-js 就是其中之一。
 */
import postgres from 'postgres';
/**
 * schema 是数据库的表结构定义，Drizzle 会根据这个文件生成 TypeScript 类型和 SQL 查询。
 */
import * as schema from './schema';

/**
 * connectionString 是数据库连接字符串，Drizzle 会用它来建立数据库连接。
 * process.env.DATABASE_URL 是环境变量，表示数据库连接字符串。
 * ! 表示这个值一定存在，不要 undefined。
 */
const connectionString = process.env.DATABASE_URL!;
/**
 * client 是数据库客户端，Drizzle 会用它来发送 SQL 查询。
 * postgres 函数会返回一个客户端。
 * { ssl: 'require' } 表示用 SSL 连接数据库，因为 Supabase 要求必须用 SSL 连接。
 */
const client = postgres(connectionString);
/**
 * db 是数据库实例，Drizzle 会用它来发送 SQL 查询。
 * drizzle 函数会返回一个数据库实例。
 * { schema } 表示用 schema 文件定义的表结构。
 */
export const db = drizzle(client, { schema });
