/**
 * Prisma Client 单例（参考实现）
 *
 * 本项目默认使用 localStorage（localRepository）。
 * 如需接入数据库，按以下步骤激活：
 *
 *   1. npx prisma generate
 *   2. npx prisma db push
 *   3. 取消下方注释
 *   4. 在 dataService.ts 中切换为 prismaRepository
 */

// import { PrismaClient } from "@prisma/client";
//
// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };
//
// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log:
//       process.env.NODE_ENV === "development"
//         ? ["query", "error", "warn"]
//         : ["error"],
//   });
//
// if (process.env.NODE_ENV !== "production") {
//   globalForPrisma.prisma = prisma;
// }
