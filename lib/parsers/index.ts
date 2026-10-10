import { parseDocxFile } from "./word";
import { parseExcelFile } from "./excel";
import { parsePdfFile } from "./pdf";
import { parseQuestionsFromRawText } from "./text-extractor";
import { ParsedQuestionDraft } from "@/types/exam";

export { parseDocxFile, parseExcelFile, parsePdfFile, parseQuestionsFromRawText };

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

  throw new Error("Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp .docx, .xlsx, .pdf hoặc .txt");
}
