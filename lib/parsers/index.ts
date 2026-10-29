import { parseDocxFile, extractTextFromDocx } from "./word";
import { parseExcelFile, extractTextFromExcel } from "./excel";
import { parsePdfFile, extractTextFromPdf } from "./pdf";
import { parseQuestionsFromRawText } from "./text-extractor";
import { ParsedQuestionDraft } from "@/types/exam";

export {
  parseDocxFile,
  parseExcelFile,
  parsePdfFile,
  parseQuestionsFromRawText,
  extractTextFromDocx,
  extractTextFromExcel,
  extractTextFromPdf,
};

export interface SmartParseResult {
  questions: ParsedQuestionDraft[];
  mode: "ai" | "fallback";
  model?: string;
  latencyMs?: number;
  reason?: string;
}

export async function parseExamFile(file: File): Promise<ParsedQuestionDraft[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    return parseDocxFile(file);
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcelFile(file);
  }

  if (name.endsWith(".pdf")) {
    return parsePdfFile(file);
  }

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    const text = await file.text();
    return parseQuestionsFromRawText(text);
  }

  throw new Error(
    "Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp .docx, .xlsx, .pdf hoặc .txt"
  );
}

/**
 * Extracts raw text from any supported exam file (.docx, .xlsx, .pdf, .txt, .md)
 */
export async function extractRawTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    return extractTextFromDocx(file);
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return extractTextFromExcel(file);
  }

  if (name.endsWith(".pdf")) {
    return extractTextFromPdf(file);
  }

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return (await file.text()).trim();
  }

  throw new Error(
    "Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp .docx, .xlsx, .pdf hoặc .txt"
  );
}

/**
 * Parses raw text (from Clipboard or extracted from a file) using Server-Side Gemini AI,
 * with automatic fallback to the traditional Regex parser if GEMINI_API_KEY is missing or AI is overloaded.
 */
export async function parseExamTextWithAI(rawText: string): Promise<SmartParseResult> {
  const cleanText = rawText.trim();
  if (!cleanText) {
    throw new Error("Vui lòng nhập hoặc dán nội dung đề thi trước khi bóc tách.");
  }

  const tStart = Date.now();
  try {
    const res = await fetch("/api/ai/parse-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: cleanText }),
    });
    const duration = Date.now() - tStart;

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.questions) && data.questions.length > 0) {
        return {
          questions: data.questions,
          mode: data.mode === "ai" ? "ai" : "fallback",
          model: data.model,
          latencyMs: data.latencyMs ?? duration,
          reason: data.reason,
        };
      }
    }
  } catch {
    // Network or server error -> automatic client-side fallback
  }

  const fallbackQuestions = parseQuestionsFromRawText(cleanText);
  return {
    questions: fallbackQuestions,
    mode: "fallback",
    reason: "Đã sử dụng bộ phân tích Regex dự phòng.",
  };
}

/**
 * Smart File Importer:
 * 1. Converts file (.docx, .pdf, .xlsx, .txt) into raw text and sends to Gemini AI Server Route.
 * 2. If Gemini AI succeeds, returns AI-structured questions.
 * 3. If Gemini AI falls back (e.g. no API key or quota limit), automatically uses the specialized file parser (e.g. Excel column parser or Word/PDF regex parser).
 */
export async function parseExamFileWithAI(file: File): Promise<SmartParseResult> {
  const name = file.name.toLowerCase();

  try {
    const rawText = await extractRawTextFromFile(file);

    if (rawText && rawText.length >= 20) {
      const aiResult = await parseExamTextWithAI(rawText);
      if (aiResult.mode === "ai" && aiResult.questions.length > 0) {
        return aiResult;
      }

      // If AI fell back to regex, for Excel files prefer the column-aware Excel parser
      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const excelQuestions = await parseExcelFile(file);
        return {
          questions: excelQuestions,
          mode: "fallback",
          reason: aiResult.reason,
        };
      }

      if (aiResult.questions.length > 0) {
        return aiResult;
      }
    }
  } catch {
    // Proceed to traditional file parser fallback
  }

  const traditionalQuestions = await parseExamFile(file);
  return {
    questions: traditionalQuestions,
    mode: "fallback",
    reason: "Đã sử dụng bộ phân tích tệp dự phòng.",
  };
}

