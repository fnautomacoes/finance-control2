/**
 * OFX Parser - Supports OFX 1.x (SGML) and 2.x (XML) formats
 */

export interface OFXTransaction {
  fitId: string;           // FITID - unique transaction ID
  type: string;            // TRNTYPE (DEBIT, CREDIT, etc)
  date: string;            // DTPOSTED (YYYY-MM-DD format)
  amount: number;          // TRNAMT
  description: string;     // NAME or MEMO
  checkNumber?: string;    // CHECKNUM
  refNumber?: string;      // REFNUM
  memo?: string;           // MEMO
}

export interface ParsedOFXData {
  bankId: string;          // BANKID
  accountId: string;       // ACCTID
  accountType: string;     // ACCTTYPE
  currency: string;        // CURDEF
  balance?: number;        // LEDGERBAL/BALAMT
  balanceDate?: string;    // DTASOF
  startDate?: string;      // DTSTART
  endDate?: string;        // DTEND
  transactions: OFXTransaction[];
}

export interface ImportTransaction {
  fitId: string;
  date: string;
  amount: string;
  type: "income" | "expense";
  description: string;
  isDuplicate: boolean;
  categoryId?: number;
  selected: boolean;
}

// OFX Transaction Type Mapping
const TRANSACTION_TYPE_MAP: Record<string, "income" | "expense"> = {
  CREDIT: "income",
  DEP: "income",
  DIRECTDEP: "income",
  INT: "income",
  DIV: "income",
  DEBIT: "expense",
  CHECK: "expense",
  PAYMENT: "expense",
  FEE: "expense",
  SRVCHG: "expense",
  ATM: "expense",
  POS: "expense",
  XFER: "expense", // Default to expense, can be either
  OTHER: "expense",
};

/**
 * Parse OFX date format (YYYYMMDD or YYYYMMDDHHMMSS) to YYYY-MM-DD
 */
function parseOFXDate(dateStr: string): string {
  if (!dateStr) return "";

  // Remove any timezone info like [0:GMT]
  const cleanDate = dateStr.replace(/\[.*\]/, "").trim();

  // Extract YYYYMMDD part
  const year = cleanDate.substring(0, 4);
  const month = cleanDate.substring(4, 6);
  const day = cleanDate.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Extract value between OFX tags
 */
function extractTagValue(content: string, tagName: string): string {
  // Handle both OFX 1.x (no closing tags) and 2.x (with closing tags)
  const patterns = [
    // OFX 2.x with closing tag
    new RegExp(`<${tagName}>([^<]*)</${tagName}>`, "i"),
    // OFX 1.x without closing tag (value until next tag or newline)
    new RegExp(`<${tagName}>([^<\\r\\n]+)`, "i"),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "";
}

/**
 * Extract all occurrences of a block (e.g., STMTTRN)
 */
function extractBlocks(content: string, blockName: string): string[] {
  const blocks: string[] = [];

  // Try XML-style closing tags first
  const xmlPattern = new RegExp(`<${blockName}>([\\s\\S]*?)</${blockName}>`, "gi");
  let match;

  while ((match = xmlPattern.exec(content)) !== null) {
    blocks.push(match[0]);
  }

  if (blocks.length > 0) {
    return blocks;
  }

  // For OFX 1.x (SGML), find blocks between tags
  const sgmlPattern = new RegExp(`<${blockName}>([\\s\\S]*?)(?=<${blockName}>|</${blockName}|$)`, "gi");

  while ((match = sgmlPattern.exec(content)) !== null) {
    blocks.push(match[0]);
  }

  return blocks;
}

/**
 * Parse a single transaction block
 */
function parseTransaction(block: string): OFXTransaction | null {
  const fitId = extractTagValue(block, "FITID");
  const type = extractTagValue(block, "TRNTYPE");
  const datePosted = extractTagValue(block, "DTPOSTED");
  const amountStr = extractTagValue(block, "TRNAMT");
  const name = extractTagValue(block, "NAME");
  const memo = extractTagValue(block, "MEMO");
  const checkNum = extractTagValue(block, "CHECKNUM");
  const refNum = extractTagValue(block, "REFNUM");

  if (!fitId || !datePosted || !amountStr) {
    return null;
  }

  const amount = parseFloat(amountStr.replace(",", "."));
  if (isNaN(amount)) {
    return null;
  }

  return {
    fitId,
    type: type || "OTHER",
    date: parseOFXDate(datePosted),
    amount,
    description: name || memo || "Transação OFX",
    memo: memo || undefined,
    checkNumber: checkNum || undefined,
    refNumber: refNum || undefined,
  };
}

/**
 * Validate if content is a valid OFX file
 */
export function validateOFX(content: string): { valid: boolean; error?: string } {
  if (!content || content.length === 0) {
    return { valid: false, error: "Arquivo vazio" };
  }

  // Check for OFX markers
  const hasOFXHeader = /OFXHEADER|<OFX>/i.test(content);
  const hasBankMsgs = /BANKMSGSRSV1|CREDITCARDMSGSRSV1/i.test(content);
  const hasTransactions = /STMTTRN|STMTTRNRS/i.test(content);

  if (!hasOFXHeader && !hasBankMsgs) {
    return { valid: false, error: "Arquivo não parece ser um OFX válido" };
  }

  if (!hasTransactions) {
    return { valid: false, error: "Nenhuma transação encontrada no arquivo OFX" };
  }

  return { valid: true };
}

/**
 * Parse OFX file content
 */
export function parseOFX(content: string): ParsedOFXData {
  const validation = validateOFX(content);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Extract account info
  const bankId = extractTagValue(content, "BANKID") ||
                 extractTagValue(content, "ORG") ||
                 "UNKNOWN";
  const accountId = extractTagValue(content, "ACCTID") || "UNKNOWN";
  const accountType = extractTagValue(content, "ACCTTYPE") ||
                      (content.includes("CREDITCARD") ? "CREDIT_CARD" : "CHECKING");
  const currency = extractTagValue(content, "CURDEF") || "BRL";

  // Extract date range
  const startDate = parseOFXDate(extractTagValue(content, "DTSTART"));
  const endDate = parseOFXDate(extractTagValue(content, "DTEND"));

  // Extract balance
  const balanceStr = extractTagValue(content, "BALAMT");
  const balance = balanceStr ? parseFloat(balanceStr.replace(",", ".")) : undefined;
  const balanceDate = parseOFXDate(extractTagValue(content, "DTASOF"));

  // Extract transactions
  const transactionBlocks = extractBlocks(content, "STMTTRN");
  const transactions: OFXTransaction[] = [];

  for (const block of transactionBlocks) {
    const transaction = parseTransaction(block);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    bankId,
    accountId,
    accountType,
    currency,
    balance,
    balanceDate,
    startDate,
    endDate,
    transactions,
  };
}

/**
 * Determine transaction type based on OFX type and amount
 */
export function determineTransactionType(
  ofxType: string,
  amount: number
): "income" | "expense" {
  // If amount is positive, it's income; negative is expense
  if (amount > 0) return "income";
  if (amount < 0) return "expense";

  // If amount is 0, use the OFX type
  return TRANSACTION_TYPE_MAP[ofxType.toUpperCase()] || "expense";
}

/**
 * Convert parsed OFX transactions to import-ready format
 */
export function prepareTransactionsForImport(
  parsedData: ParsedOFXData,
  existingFitIds: Set<string>
): ImportTransaction[] {
  return parsedData.transactions.map((tx) => {
    const type = determineTransactionType(tx.type, tx.amount);
    const absoluteAmount = Math.abs(tx.amount);

    return {
      fitId: tx.fitId,
      date: tx.date,
      amount: absoluteAmount.toFixed(2),
      type,
      description: tx.description,
      isDuplicate: existingFitIds.has(tx.fitId),
      selected: !existingFitIds.has(tx.fitId), // Auto-select non-duplicates
    };
  });
}

/**
 * Simple category matcher based on description patterns
 */
export function suggestCategory(
  description: string,
  categoryMappings: Array<{ pattern: string; categoryId: number }>
): number | undefined {
  const normalizedDesc = description.toLowerCase();

  for (const mapping of categoryMappings) {
    if (normalizedDesc.includes(mapping.pattern.toLowerCase())) {
      return mapping.categoryId;
    }
  }

  return undefined;
}
