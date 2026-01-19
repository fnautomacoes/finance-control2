// server/scripts/verify-transactions.ts
// Script para verificar transações no banco de dados
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

async function verifyTransactions() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 VERIFICAÇÃO COMPLETA DE TRANSAÇÕES NO BANCO DE DADOS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL não configurada!");
    process.exit(1);
  }

  console.log("📡 Conectando ao banco de dados...");
  console.log("   URL:", databaseUrl.replace(/:[^:@]+@/, ":****@"));

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log("✅ Conexão estabelecida!\n");

    const db = drizzle(pool);

    // 1. Verificar usuários
    console.log("━━━ 1. USUÁRIOS ━━━");
    const usersResult = await client.query(
      'SELECT id, email, name FROM users ORDER BY id'
    );
    console.log(`📊 Total de usuários: ${usersResult.rows.length}`);
    if (usersResult.rows.length > 0) {
      console.table(usersResult.rows);
    } else {
      console.log("⚠️  Nenhum usuário cadastrado!");
    }

    // 2. Verificar contas
    console.log("\n━━━ 2. CONTAS ━━━");
    const accountsResult = await client.query(
      'SELECT id, "userId", name, type, balance FROM accounts ORDER BY id'
    );
    console.log(`📊 Total de contas: ${accountsResult.rows.length}`);
    if (accountsResult.rows.length > 0) {
      console.table(accountsResult.rows);
    } else {
      console.log("⚠️  Nenhuma conta cadastrada!");
    }

    // 3. Verificar total de transações
    console.log("\n━━━ 3. TRANSAÇÕES - RESUMO ━━━");
    const totalTxResult = await client.query(
      'SELECT COUNT(*) as total FROM transactions'
    );
    console.log(`📊 Total de transações no banco: ${totalTxResult.rows[0].total}`);

    // 4. Transações por usuário
    console.log("\n━━━ 4. TRANSAÇÕES POR USUÁRIO ━━━");
    const txByUserResult = await client.query(`
      SELECT
        t."userId",
        u.email,
        COUNT(*) as total_transactions
      FROM transactions t
      LEFT JOIN users u ON u.id = t."userId"
      GROUP BY t."userId", u.email
      ORDER BY t."userId"
    `);
    if (txByUserResult.rows.length > 0) {
      console.table(txByUserResult.rows);
    } else {
      console.log("⚠️  Nenhuma transação encontrada!");
    }

    // 5. Transações por conta
    console.log("\n━━━ 5. TRANSAÇÕES POR CONTA ━━━");
    const txByAccountResult = await client.query(`
      SELECT
        t."accountId",
        a.name as account_name,
        a."userId",
        COUNT(*) as total_transactions
      FROM transactions t
      LEFT JOIN accounts a ON a.id = t."accountId"
      GROUP BY t."accountId", a.name, a."userId"
      ORDER BY t."accountId"
    `);
    if (txByAccountResult.rows.length > 0) {
      console.table(txByAccountResult.rows);
    } else {
      console.log("⚠️  Nenhuma transação encontrada!");
    }

    // 6. Últimas 10 transações
    console.log("\n━━━ 6. ÚLTIMAS 10 TRANSAÇÕES ━━━");
    const recentTxResult = await client.query(`
      SELECT
        id,
        "userId",
        "accountId",
        description,
        amount,
        type,
        date,
        "fitId",
        "createdAt"
      FROM transactions
      ORDER BY id DESC
      LIMIT 10
    `);
    if (recentTxResult.rows.length > 0) {
      console.table(recentTxResult.rows.map(row => ({
        ...row,
        description: row.description?.substring(0, 30) + (row.description?.length > 30 ? '...' : ''),
        fitId: row.fitId?.substring(0, 20) + (row.fitId?.length > 20 ? '...' : ''),
      })));
    } else {
      console.log("⚠️  Nenhuma transação encontrada!");
    }

    // 7. Verificar transações órfãs
    console.log("\n━━━ 7. VERIFICAÇÕES DE INTEGRIDADE ━━━");

    // Transações sem userId
    const orphanUserResult = await client.query(
      'SELECT COUNT(*) as total FROM transactions WHERE "userId" IS NULL'
    );
    console.log(`⚠️  Transações sem userId: ${orphanUserResult.rows[0].total}`);

    // Transações sem accountId
    const orphanAccountResult = await client.query(
      'SELECT COUNT(*) as total FROM transactions WHERE "accountId" IS NULL'
    );
    console.log(`⚠️  Transações sem accountId: ${orphanAccountResult.rows[0].total}`);

    // Transações com accountId inválido
    const invalidAccountResult = await client.query(`
      SELECT COUNT(*) as total
      FROM transactions t
      LEFT JOIN accounts a ON a.id = t."accountId"
      WHERE a.id IS NULL
    `);
    console.log(`⚠️  Transações com accountId inválido: ${invalidAccountResult.rows[0].total}`);

    // Transações com userId diferente do account
    const mismatchResult = await client.query(`
      SELECT COUNT(*) as total
      FROM transactions t
      JOIN accounts a ON a.id = t."accountId"
      WHERE t."userId" != a."userId"
    `);
    console.log(`⚠️  Transações com userId divergente da conta: ${mismatchResult.rows[0].total}`);

    // 8. Transações importadas via OFX
    console.log("\n━━━ 8. IMPORTAÇÕES OFX ━━━");
    const ofxTxResult = await client.query(
      'SELECT COUNT(*) as total FROM transactions WHERE "fitId" IS NOT NULL'
    );
    console.log(`📥 Transações importadas via OFX: ${ofxTxResult.rows[0].total}`);

    // Histórico de importações
    const ofxImportsResult = await client.query(`
      SELECT
        id,
        "userId",
        "accountId",
        "fileName",
        "transactionCount",
        "duplicateCount",
        "createdAt"
      FROM ofx_imports
      ORDER BY id DESC
      LIMIT 5
    `);
    if (ofxImportsResult.rows.length > 0) {
      console.log("\n📜 Últimas importações:");
      console.table(ofxImportsResult.rows);
    }

    // 9. Teste de query específica
    console.log("\n━━━ 9. TESTE DE QUERY POR USUÁRIO ━━━");
    if (usersResult.rows.length > 0) {
      const testUserId = usersResult.rows[0].id;
      console.log(`🔍 Testando query para userId = ${testUserId}`);

      const userTxResult = await client.query(`
        SELECT
          id,
          "userId",
          "accountId",
          description,
          amount,
          type,
          date
        FROM transactions
        WHERE "userId" = $1
        ORDER BY date DESC, id DESC
        LIMIT 10
      `, [testUserId]);

      console.log(`📊 Transações encontradas: ${userTxResult.rows.length}`);
      if (userTxResult.rows.length > 0) {
        console.table(userTxResult.rows.map(row => ({
          ...row,
          description: row.description?.substring(0, 30),
        })));
      }
    }

    client.release();

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ VERIFICAÇÃO CONCLUÍDA");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error: any) {
    console.error("❌ ERRO:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

verifyTransactions().catch(console.error);
