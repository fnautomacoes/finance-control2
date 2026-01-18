/**
 * OFX Parser - Supports OFX 1.x (SGML) and 2.x (XML) formats
 *
 * OFX 1.x uses SGML format with:
 * - Headers before <OFX> tag (OFXHEADER:100, DATA:OFXSGML, etc.)
 * - Tags without closing tags (value ends at next tag or newline)
 *
 * OFX 2.x uses standard XML with proper closing tags
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

export interface OFXHeaders {
  version: string;
  encoding: string;
  charset: string;
  isSGML: boolean;
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
  headers?: OFXHeaders;
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
 * Detect if OFX content is version 1.x (SGML) or 2.x (XML)
 */
function detectOFXVersion(content: string): { version: "1" | "2"; isSGML: boolean } {
  // OFX 1.x indicators
  if (content.includes("OFXHEADER:") || content.includes("DATA:OFXSGML")) {
    return { version: "1", isSGML: true };
  }

  // OFX 2.x uses XML declaration or proper XML structure
  if (content.includes("<?xml") || content.includes('<?OFX')) {
    return { version: "2", isSGML: false };
  }

  // Check for SGML-style tags without closing
  // In SGML, we often see <TAG>value without </TAG>
  if (/<[A-Z]+>[^<]+(?=<[A-Z]|$)/m.test(content)) {
    return { version: "1", isSGML: true };
  }

  // Default to SGML for compatibility
  return { version: "1", isSGML: true };
}

/**
 * Parse SGML headers from OFX 1.x content
 */
function parseSGMLHeaders(content: string): OFXHeaders {
  const headers: OFXHeaders = {
    version: "102",
    encoding: "USASCII",
    charset: "1252",
    isSGML: true,
  };

  // Extract header lines before <OFX>
  const headerSection = content.split(/<OFX>/i)[0];

  const versionMatch = headerSection.match(/VERSION:(\d+)/);
  if (versionMatch) headers.version = versionMatch[1];

  const encodingMatch = headerSection.match(/ENCODING:(\w+)/);
  if (encodingMatch) headers.encoding = encodingMatch[1];

  const charsetMatch = headerSection.match(/CHARSET:(\d+)/);
  if (charsetMatch) headers.charset = charsetMatch[1];

  return headers;
}

/**
 * Convert SGML content to more parseable format
 * Handles tags without closing tags by finding value until next tag
 */
function normalizeSGMLContent(content: string): string {
  // Remove headers section - keep only from <OFX> onwards
  const ofxStart = content.indexOf("<OFX>");
  if (ofxStart === -1) {
    const ofxStartLower = content.toLowerCase().indexOf("<ofx>");
    if (ofxStartLower !== -1) {
      content = content.substring(ofxStartLower);
    }
  } else {
    content = content.substring(ofxStart);
  }

  // Normalize line endings
  content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  return content;
}

/**
 * Parse OFX date format (YYYYMMDD or YYYYMMDDHHMMSS) to YYYY-MM-DD
 */
function parseOFXDate(dateStr: string): string {
  if (!dateStr) return "";

  // Remove any timezone info like [0:GMT] or [-03:EST]
  const cleanDate = dateStr.replace(/\[.*?\]/, "").trim();

  // Extract YYYYMMDD part (minimum 8 characters)
  if (cleanDate.length < 8) return "";

  const year = cleanDate.substring(0, 4);
  const month = cleanDate.substring(4, 6);
  const day = cleanDate.substring(6, 8);

  // Validate date parts
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) return "";
  if (monthNum < 1 || monthNum > 12) return "";
  if (dayNum < 1 || dayNum > 31) return "";

  return `${year}-${month}-${day}`;
}

/**
 * Extract value between OFX tags - handles both SGML and XML
 */
function extractTagValue(content: string, tagName: string): string {
  // Pattern 1: XML-style with closing tag: <TAG>value</TAG>
  const xmlPattern = new RegExp(`<${tagName}>\\s*([^<]*?)\\s*</${tagName}>`, "i");
  const xmlMatch = content.match(xmlPattern);
  if (xmlMatch && xmlMatch[1]) {
    return xmlMatch[1].trim();
  }

  // Pattern 2: SGML-style - value until next tag or newline
  // <TAG>value<NEXTTAG> or <TAG>value\n
  const sgmlPattern = new RegExp(`<${tagName}>([^<\\n\\r]+)`, "i");
  const sgmlMatch = content.match(sgmlPattern);
  if (sgmlMatch && sgmlMatch[1]) {
    return sgmlMatch[1].trim();
  }

  return "";
}

/**
 * Extract all STMTTRN blocks from content
 */
function extractTransactionBlocks(content: string): string[] {
  const blocks: string[] = [];

  // Try XML-style first: <STMTTRN>...</STMTTRN>
  const xmlPattern = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = xmlPattern.exec(content)) !== null) {
    blocks.push(match[0]);
  }

  if (blocks.length > 0) {
    return blocks;
  }

  // For SGML, find content between <STMTTRN> tags
  // Each block starts with <STMTTRN> and ends before the next <STMTTRN> or </BANKTRANLIST>
  const sgmlPattern = /<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/STMTTRN>|<\/BANKTRANLIST>|<\/CCSTMTRS>|<\/STMTRS>|$)/gi;

  while ((match = sgmlPattern.exec(content)) !== null) {
    blocks.push("<STMTTRN>" + match[1]);
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

  // FITID and DTPOSTED are required
  if (!fitId) {
    console.warn("Transaction missing FITID, skipping");
    return null;
  }

  if (!datePosted) {
    console.warn(`Transaction ${fitId} missing DTPOSTED, skipping`);
    return null;
  }

  if (!amountStr) {
    console.warn(`Transaction ${fitId} missing TRNAMT, skipping`);
    return null;
  }

  // Parse amount - handle both comma and dot as decimal separator
  const normalizedAmount = amountStr.replace(",", ".");
  const amount = parseFloat(normalizedAmount);

  if (isNaN(amount)) {
    console.warn(`Transaction ${fitId} has invalid amount: ${amountStr}`);
    return null;
  }

  const parsedDate = parseOFXDate(datePosted);
  if (!parsedDate) {
    console.warn(`Transaction ${fitId} has invalid date: ${datePosted}`);
    return null;
  }

  // Description: prefer NAME, fallback to MEMO
  const description = name || memo || "Transação OFX";

  return {
    fitId,
    type: type || "OTHER",
    date: parsedDate,
    amount,
    description,
    memo: memo || undefined,
    checkNumber: checkNum || undefined,
    refNumber: refNum || undefined,
  };
}

/**
 * Validate if content is a valid OFX file
 */
export function validateOFX(content: string): {
  valid: boolean;
  error?: string;
  details?: {
    hasOFXTag: boolean;
    hasBankMsgs: boolean;
    hasTransactionList: boolean;
    hasTransactions: boolean;
    version: "1" | "2";
    isSGML: boolean;
  };
} {
  if (!content || content.length === 0) {
    return { valid: false, error: "Arquivo vazio" };
  }

  // Trim and check
  const trimmedContent = content.trim();
  if (trimmedContent.length < 50) {
    return { valid: false, error: "Arquivo muito pequeno para ser um OFX válido" };
  }

  // Detect version
  const { version, isSGML } = detectOFXVersion(trimmedContent);

  // Check for OFX root tag
  const hasOFXTag = /<OFX>/i.test(trimmedContent);
  const hasOFXHeader = /OFXHEADER:/i.test(trimmedContent);

  if (!hasOFXTag && !hasOFXHeader) {
    return {
      valid: false,
      error: "Arquivo não contém tag <OFX> ou cabeçalho OFXHEADER"
    };
  }

  // Check for bank messages section
  const hasBankMsgs = /BANKMSGSRSV1|CREDITCARDMSGSRSV1/i.test(trimmedContent);
  if (!hasBankMsgs) {
    return {
      valid: false,
      error: "Arquivo não contém seção de mensagens bancárias (BANKMSGSRSV1 ou CREDITCARDMSGSRSV1)"
    };
  }

  // Check for transaction list
  const hasTransactionList = /BANKTRANLIST|CCSTMTRS/i.test(trimmedContent);
  if (!hasTransactionList) {
    return {
      valid: false,
      error: "Arquivo não contém lista de transações (BANKTRANLIST)"
    };
  }

  // Check for at least one transaction
  const hasTransactions = /<STMTTRN>/i.test(trimmedContent);
  if (!hasTransactions) {
    return {
      valid: false,
      error: "Nenhuma transação encontrada no arquivo OFX (tag STMTTRN ausente)"
    };
  }

  return {
    valid: true,
    details: {
      hasOFXTag,
      hasBankMsgs,
      hasTransactionList,
      hasTransactions,
      version,
      isSGML,
    }
  };
}

/**
 * Parse OFX file content
 */
export function parseOFX(content: string): ParsedOFXData {
  // Validate first
  const validation = validateOFX(content);
  if (!validation.valid) {
    throw new Error(validation.error || "Arquivo OFX inválido");
  }

  // Detect version and parse headers if SGML
  const { version, isSGML } = detectOFXVersion(content);
  let headers: OFXHeaders | undefined;

  if (isSGML) {
    headers = parseSGMLHeaders(content);
  }

  // Normalize content for parsing
  const normalizedContent = normalizeSGMLContent(content);

  // Extract account info
  const bankId = extractTagValue(normalizedContent, "BANKID") ||
                 extractTagValue(normalizedContent, "ORG") ||
                 "UNKNOWN";
  const accountId = extractTagValue(normalizedContent, "ACCTID") || "UNKNOWN";

  // Account type detection
  let accountType = extractTagValue(normalizedContent, "ACCTTYPE");
  if (!accountType) {
    // Check if it's a credit card statement
    if (/CREDITCARDMSGSRSV1|CCSTMTRS/i.test(normalizedContent)) {
      accountType = "CREDIT_CARD";
    } else {
      accountType = "CHECKING";
    }
  }

  const currency = extractTagValue(normalizedContent, "CURDEF") || "BRL";

  // Extract date range from BANKTRANLIST
  const startDate = parseOFXDate(extractTagValue(normalizedContent, "DTSTART"));
  const endDate = parseOFXDate(extractTagValue(normalizedContent, "DTEND"));

  // Extract balance from LEDGERBAL or AVAILBAL
  let balance: number | undefined;
  let balanceDate: string | undefined;

  // Try LEDGERBAL first
  const ledgerBalSection = normalizedContent.match(/<LEDGERBAL>([\s\S]*?)(?=<\/LEDGERBAL>|<AVAILBAL>|<\/STMTRS>|<\/CCSTMTRS>)/i);
  if (ledgerBalSection) {
    const balAmt = extractTagValue(ledgerBalSection[0], "BALAMT");
    if (balAmt) {
      balance = parseFloat(balAmt.replace(",", "."));
      if (isNaN(balance)) balance = undefined;
    }
    balanceDate = parseOFXDate(extractTagValue(ledgerBalSection[0], "DTASOF"));
  }

  // Fallback to direct BALAMT
  if (balance === undefined) {
    const balAmtDirect = extractTagValue(normalizedContent, "BALAMT");
    if (balAmtDirect) {
      balance = parseFloat(balAmtDirect.replace(",", "."));
      if (isNaN(balance)) balance = undefined;
    }
  }

  // Extract transactions
  const transactionBlocks = extractTransactionBlocks(normalizedContent);
  const transactions: OFXTransaction[] = [];
  let skippedCount = 0;

  for (const block of transactionBlocks) {
    const transaction = parseTransaction(block);
    if (transaction) {
      transactions.push(transaction);
    } else {
      skippedCount++;
    }
  }

  if (skippedCount > 0) {
    console.warn(`Skipped ${skippedCount} invalid transactions`);
  }

  // Sort by date descending (newest first)
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
    headers,
  };
}

/**
 * Determine transaction type based on OFX type and amount
 */
export function determineTransactionType(
  ofxType: string,
  amount: number
): "income" | "expense" {
  // Primary determination by amount sign
  // Positive = income (money coming in)
  // Negative = expense (money going out)
  if (amount > 0) return "income";
  if (amount < 0) return "expense";

  // If amount is exactly 0, use the OFX type hint
  const typeUpper = ofxType.toUpperCase();
  return TRANSACTION_TYPE_MAP[typeUpper] || "expense";
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
    const pattern = mapping.pattern.toLowerCase();
    if (normalizedDesc.includes(pattern)) {
      return mapping.categoryId;
    }
  }

  return undefined;
}

/**
 * Get a summary of the parsed OFX file for debugging
 */
export function getOFXSummary(data: ParsedOFXData): string {
  const lines = [
    `Bank ID: ${data.bankId}`,
    `Account ID: ${data.accountId}`,
    `Account Type: ${data.accountType}`,
    `Currency: ${data.currency}`,
    `Date Range: ${data.startDate || "N/A"} to ${data.endDate || "N/A"}`,
    `Balance: ${data.balance !== undefined ? data.balance.toFixed(2) : "N/A"}`,
    `Transactions: ${data.transactions.length}`,
  ];

  if (data.headers) {
    lines.push(`Format: SGML (OFX 1.x, Version ${data.headers.version})`);
  }

  return lines.join("\n");
}
