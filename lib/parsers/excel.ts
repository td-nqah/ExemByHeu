import * as XLSX from "xlsx";
import { ParsedQuestionDraft } from "@/types/exam";

export async function extractTextFromExcel(file: File | ArrayBuffer): Promise<string> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return "";

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
  if (!rows || rows.length === 0) return "";

  const lines: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const cells = row
      .map((cell) => String(cell ?? "").trim())
      .filter(Boolean);
    if (cells.length > 0) {
      lines.push(`Dòng ${i + 1}: ${cells.join(" | ")}`);
    }
  }

  return lines.join("\n").trim();
}

export async function parseExcelFile(file: File | ArrayBuffer): Promise<ParsedQuestionDraft[]> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = file;
    }

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("Tệp Excel không có trang tính (Sheet) nào.");
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

    if (!rows || rows.length < 2) {
      throw new Error("Tệp Excel cần chứa ít nhất một dòng tiêu đề và một dòng dữ liệu.");
    }

    const headers: string[] = (rows[0] || []).map((h: any) => String(h || "").trim().toLowerCase());

    // Helper to find column index matching keywords
    const findIndex = (...keywords: string[]): number => {
      return headers.findIndex((h) => keywords.some((k) => h.includes(k.toLowerCase())));
    };

    const contentIdx = findIndex("câu hỏi", "nội dung", "question", "content");
    const typeIdx = findIndex("loại", "type", "hình thức");
    const optAIdx = findIndex("lựa chọn a", "đáp án a", "option a", "a");
    const optBIdx = findIndex("lựa chọn b", "đáp án b", "option b", "b");
    const optCIdx = findIndex("lựa chọn c", "đáp án c", "option c", "c");
    const optDIdx = findIndex("lựa chọn d", "đáp án d", "option d", "d");
    const correctIdx = findIndex("đáp án đúng", "correct", "key", "đáp án");
    const scoreIdx = findIndex("điểm", "score", "max score");

    const results: ParsedQuestionDraft[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // Extract content
      const content = contentIdx !== -1 ? String(row[contentIdx] || "").trim() : String(row[0] || "").trim();
      if (!content) continue;

      // Extract options
      const options: string[] = [];
      const addOption = (idx: number, prefix: string) => {
        if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) {
          const val = String(row[idx]).trim();
          if (val) {
            // If already prefixed with "A." or "A:", keep or normalize
            if (/^[A-D][\.\:\)]/i.test(val)) {
              options.push(val);
            } else {
              options.push(`${prefix}. ${val}`);
            }
          }
        }
      };

      addOption(optAIdx, "A");
      addOption(optBIdx, "B");
      addOption(optCIdx, "C");
      addOption(optDIdx, "D");

      // Extract type
      let type: "multiple_choice" | "essay" = "multiple_choice";
      if (typeIdx !== -1 && row[typeIdx]) {
        const rawType = String(row[typeIdx]).toLowerCase();
        if (rawType.includes("tự luận") || rawType.includes("essay")) {
          type = "essay";
        }
      } else {
        type = options.length >= 2 ? "multiple_choice" : "essay";
      }

      // Extract correct answer
      let correctAnswer = "A";
      if (correctIdx !== -1 && row[correctIdx] !== undefined) {
        const rawKey = String(row[correctIdx]).trim().toUpperCase();
        const keyMatch = rawKey.match(/([A-D])/);
        correctAnswer = keyMatch ? keyMatch[1] : (rawKey || "A");
      }

      // Extract max score
      let maxScore = type === "multiple_choice" ? 2.0 : 4.0;
      if (scoreIdx !== -1 && row[scoreIdx] !== undefined) {
        const parsedScore = parseFloat(String(row[scoreIdx]));
        if (!isNaN(parsedScore) && parsedScore > 0) {
          maxScore = parsedScore;
        }
      }

      results.push({
        id: `draft_xl_${Date.now()}_${i}`,
        type,
        content,
        options: type === "multiple_choice" ? options : [],
        correct_answer: type === "multiple_choice" ? correctAnswer : "",
        max_score: maxScore,
      });
    }

    if (results.length === 0) {
      throw new Error("Không tìm thấy dòng câu hỏi hợp lệ trong bảng tính.");
    }

    return results;
  } catch (error: any) {
    throw new Error(`Lỗi phân tích tệp Excel (.xlsx): ${error?.message || "Định dạng không hợp lệ"}`);
  }
}
