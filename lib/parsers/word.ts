import mammoth from "mammoth";
import { parseQuestionsFromRawText } from "./text-extractor";
import { ParsedQuestionDraft } from "@/types/exam";

export async function parseDocxFile(file: File | ArrayBuffer): Promise<ParsedQuestionDraft[]> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = file;
    }

    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value || "";

    if (!rawText.trim()) {
      throw new Error("Tệp Word không chứa nội dung văn bản hợp lệ.");
    }

    return parseQuestionsFromRawText(rawText);
  } catch (error: any) {
    throw new Error(`Lỗi phân tích tệp Word (.docx): ${error?.message || "Định dạng không hợp lệ"}`);
  }
}
