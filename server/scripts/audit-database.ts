/**
 * Database Audit Script
 * Run with: npx tsx server/scripts/audit-database.ts
 *
 * This script performs a comprehensive audit of the database to diagnose
 * persistence issues, especially with OFX import.
 */

import { eq, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../drizzle/schema";

const { transactions, accounts, users, categories, ofxImports } = schema;

async function runAudit() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║            AUDITORIA COMPLETA DO BANCO DE DADOS           ║
║                  ${new Date().toISOString()}              ║
╚════════════════════════════════════════════════════════════╝
  `);

  // Check DATABASE_URL
  console.log("1️⃣  Verificando DATABASE_URL...");
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não está definida!");
    console.log("   Defina a variável de ambiente DATABASE_URL");
    process.exit(1);
  }
  console.log("✅ DATABASE_URL:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@"));

  // Connect to database
  console.log("\n2️⃣  Conectando ao PostgreSQL...");
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  try {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();
    const testResult = await client.query('SELECT NOW() as now, current_database() as db, version() as version');
    console.log("✅ Conexão bem-sucedida!");
    console.log("   📅 Server time:", testResult.rows[0].now);
    console.log("   🗄️  Database:", testResult.rows[0].db);
    console.log("   📋 Version:", testResult.rows[0].version.split(',')[0]);
    client.release();

    db = drizzle(pool);
  } catch (error: any) {
    console.error("❌ Falha na conexão:", error.message);
    process.exit(1);
  }

  // Check tables exist
  console.log("\n3️⃣  Verificando tabelas...");
  try {
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log("✅ Tabelas encontradas:", tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log("   - " + row.table_name);
    });
  } catch (error: any) {
    console.error("❌ Erro ao listar tabelas:", error.message);
  }

  // Check transactions table structure
  console.log("\n4️⃣  Verificando estrutura da tabela transactions...");
  try {
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `);
    console.log("✅ Colunas da tabela transactions:");
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Check if fitId column exists
    const hasFitId = columnsResult.rows.some(r => r.column_name === 'fitId');
    if (!hasFitId) {
      console.error("❌ PROBLEMA: Coluna 'fitId' não existe na tabela transactions!");
      console.log("   Execute a migration SQL para adicionar esta coluna.");
    } else {
      console.log("✅ Coluna 'fitId' existe");
    }
  } catch (error: any) {
    console.error("❌ Erro ao verificar estrutura:", error.message);
  }

  // Count records in each table
  console.log("\n5️⃣  Contagem de registros...");
  try {
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const accountCount = await db.select({ count: sql<number>`count(*)` }).from(accounts);
    const categoryCount = await db.select({ count: sql<number>`count(*)` }).from(categories);
    const transactionCount = await db.select({ count: sql<number>`count(*)` }).from(transactions);
    const ofxImportCount = await db.select({ count: sql<number>`count(*)` }).from(ofxImports);

    console.log("   👤 Users:", userCount[0].count);
    console.log("   🏦 Accounts:", accountCount[0].count);
    console.log("   🏷️  Categories:", categoryCount[0].count);
    console.log("   💳 Transactions:", transactionCount[0].count);
    console.log("   📥 OFX Imports:", ofxImportCount[0].count);
  } catch (error: any) {
    console.error("❌ Erro ao contar registros:", error.message);
  }

  // Check recent transactions
  console.log("\n6️⃣  Últimas transações...");
  try {
    const recentTx = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(5);

    if (recentTx.length === 0) {
      console.log("⚠️ Nenhuma transação encontrada no banco");
    } else {
      console.log("✅ Últimas 5 transações:");
      recentTx.forEach((tx, i) => {
        console.log(`   ${i + 1}. [${tx.id}] ${tx.description} - ${tx.amount} (${tx.type}) - ${tx.date}`);
        console.log(`      FitId: ${tx.fitId || 'N/A'} | Created: ${tx.createdAt}`);
      });
    }
  } catch (error: any) {
    console.error("❌ Erro ao buscar transações:", error.message);
  }

  // Check transactions with fitId (OFX imports)
  console.log("\n7️⃣  Transações importadas via OFX (com fitId)...");
  try {
    const ofxTx = await db
      .select()
      .from(transactions)
      .where(sql`${transactions.fitId} IS NOT NULL`)
      .limit(10);

    console.log(`✅ Transações com fitId: ${ofxTx.length}`);
    if (ofxTx.length > 0) {
      ofxTx.forEach((tx, i) => {
        console.log(`   ${i + 1}. FitId: ${tx.fitId} - ${tx.description}`);
      });
    }
  } catch (error: any) {
    console.error("❌ Erro ao buscar transações OFX:", error.message);
  }

  // Check OFX import history
  console.log("\n8️⃣  Histórico de importações OFX...");
  try {
    const imports = await db
      .select()
      .from(ofxImports)
      .orderBy(desc(ofxImports.createdAt))
      .limit(5);

    if (imports.length === 0) {
      console.log("⚠️ Nenhuma importação OFX registrada");
    } else {
      console.log("✅ Últimas importações:");
      imports.forEach((imp, i) => {
        console.log(`   ${i + 1}. [${imp.id}] Account: ${imp.accountId} | Transactions: ${imp.transactionCount} | Duplicates: ${imp.duplicateCount}`);
        console.log(`      File: ${imp.fileName || 'N/A'} | Created: ${imp.createdAt}`);
      });
    }
  } catch (error: any) {
    console.error("❌ Erro ao buscar histórico OFX:", error.message);
  }

  // Test INSERT
  console.log("\n9️⃣  Testando INSERT manual...");
  try {
    // Get first user and account
    const firstUser = await db.select().from(users).limit(1);
    const firstAccount = await db.select().from(accounts).limit(1);

    if (firstUser.length === 0) {
      console.log("⚠️ Nenhum usuário encontrado para testar");
    } else if (firstAccount.length === 0) {
      console.log("⚠️ Nenhuma conta encontrada para testar");
    } else {
      const testFitId = `TEST_AUDIT_${Date.now()}`;
      const testData = {
        userId: firstUser[0].id,
        accountId: firstAccount[0].id,
        description: "TESTE DE AUDITORIA - PODE DELETAR",
        amount: "1.00",
        type: "expense" as const,
        date: new Date().toISOString().split('T')[0],
        fitId: testFitId,
        status: "completed" as const,
      };

      console.log("   Inserindo transação de teste...");
      console.log("   Dados:", JSON.stringify(testData, null, 2));

      const result = await db.insert(transactions).values(testData).returning();

      if (result.length > 0) {
        console.log("✅ INSERT bem-sucedido! ID:", result[0].id);

        // Verify it exists
        const verify = await db
          .select()
          .from(transactions)
          .where(eq(transactions.fitId, testFitId))
          .limit(1);

        if (verify.length > 0) {
          console.log("✅ Verificação: Transação encontrada no banco!");

          // Clean up
          await db.delete(transactions).where(eq(transactions.id, result[0].id));
          console.log("🧹 Limpeza: Transação de teste removida");
        } else {
          console.error("❌ PROBLEMA: Transação não encontrada após INSERT!");
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Erro no teste de INSERT:", error.message);
    console.error("   Código:", error.code);
    console.error("   Detalhe:", error.detail);
  }

  // Summary
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                   AUDITORIA FINALIZADA                    ║
╚════════════════════════════════════════════════════════════╝

📋 CHECKLIST DE VERIFICAÇÃO:
   [ ] DATABASE_URL está correta
   [ ] Conexão PostgreSQL funciona
   [ ] Tabelas existem
   [ ] Coluna fitId existe em transactions
   [ ] INSERT funciona corretamente
   [ ] Transações aparecem no banco após importação

🔧 SE O PROBLEMA PERSISTIR:
   1. Verifique os logs do servidor durante a importação
   2. Execute: npm run dev e observe os logs
   3. Verifique se não há erros silenciosos
   4. Confirme que as migrations foram aplicadas
  `);

  await pool.end();
}

runAudit().catch(console.error);
