import mammoth from "mammoth";
import { parseQuestionsFromRawText } from "./text-extractor";
import { ParsedQuestionDraft } from "@/types/exam";

export async function extractTextFromDocx(file: File | ArrayBuffer): Promise<string> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || "").trim();
}

export async function parseDocxFile(file: File | ArrayBuffer): Promise<ParsedQuestionDraft[]> {
  try {
    const rawText = await extractTextFromDocx(file);

    if (!rawText) {
      throw new Error("Tệp Word không chứa nội dung văn bản hợp lệ.");
    }

    return parseQuestionsFromRawText(rawText);
  } catch (error: any) {
    throw new Error(`Lỗi phân tích tệp Word (.docx): ${error?.message || "Định dạng không hợp lệ"}`);
  }
}

