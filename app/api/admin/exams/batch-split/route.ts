import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { ParsedQuestionDraft } from "@/types/exam";

export const maxDuration = 60;

// Strip leading "Câu 1:", "Question 1.", "1.", "PHẦN I...", "Câu hỏi tự luận:", etc.
function cleanQuestionContent(raw: string): string {
  return raw
    .replace(/^(?:PHẦN|PART|MỤC)\s+[IVX\d]+[\.\:\-\s]+.*$/gim, "")
    .replace(
      /^(?:(?:Câu(?:\s+hỏi)?|Question|Bài)\s*(?:\d+|tự\s*luận)?|CÂU\s*HỎI\s*TỰ\s*LUẬN)\s*[\.\:\)\-\/]*\s*/i,
      ""
    )
    .replace(/^\d+\s*[\.\)\/]\s*/i, "")
    .trim();
}

// Normalize options to clean "A. ...", "B. ...", "C. ...", "D. ..."
function normalizeOptions(rawOptions: any[]): string[] {
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions
    .map((opt: any, idx: number) => {
      const str = String(opt || "").trim();
      if (!str) return "";
      const letter = String.fromCharCode(65 + idx);
      if (/^[A-D][\.\:\)]\s*/i.test(str)) {
        return str.replace(/^([A-D])[\.\:\)]\s*/i, (_, l) => `${l.toUpperCase()}. `);
      }
      return `${letter}. ${str}`;
    })
    .filter(Boolean);
}

// Clean exam title extracted from header
function cleanExamTitle(rawTitle: string): string {
  let title = rawTitle
    .replace(/(?:Thời\s*gian(?:\s*làm\s*bài)?|Thời\s*lượng)[\:\s\-]+.*$/i, "")
    .replace(/\(Không\s*sử\s*dụng\s*tài\s*liệu\)/gi, "")
    .replace(/[\(\[]?(?:Mã\s*HP|Mã\s*học\s*phần)[\:\s\-]+[^\)\s\]]+[\)\]]?/gi, "")
    .replace(/[\:\.\-]+$/, "")
    .trim();

  title = title.replace(/\s*Môn\s*(?:học)?[\:\s\-]+/i, " - ");
  return title.trim() || rawTitle;
}

// Convert Mammoth HTML into marked text so formatting (bold, underline) is preserved as answer markers
function convertHtmlToMarkedText(html: string): string {
  return html
    // Bold or underline on option letter or whole option indicates correct answer
    .replace(/<(?:strong|b|u|em)>(\s*\*?[A-D][\.\:\)])/gi, "*$1")
    .replace(/(\*?[A-D][\.\:\)][^<]+)<\/(?:strong|b|u|em)>/gi, "$1 (đáp án đúng)")
    // Line breaks & tables
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "\t")
    // Strip other HTML tags
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

// Extract Answer Key Table / List (e.g., "1. C  2. D", "1-C  2-D", "1C  2D", or horizontal table)
function extractAnswerMapFromSection(text: string): Map<number, string> {
  const map = new Map<number, string>();
  if (!text) return map;

  const answerKeyHeaderRegex =
    /(?:^|\n)\s*(?:(?:PHẦN|BẢNG|DANH\s*SÁCH|PHIẾU)?\s*(?:ĐÁP\s*ÁN|TRẢ\s*LỜI)(?:\s*TRẮC\s*NGHIỆM|\s*CHI\s*TIẾT)?|HƯỚNG\s*DẪN\s*CHẤM|ANSWER\s*KEYS?|KEYS?)[\:\s\-\n]/i;

  const headerIdx = text.search(answerKeyHeaderRegex);

  // 1. If explicit answer section header exists, extract Pattern 1 & Pattern 2 from targetText
  if (headerIdx !== -1) {
    const targetText = text.slice(headerIdx);
    const p1 = /(?:Câu\s*)?(\d+)[^\n\S]*(?:[:.\-\/]|[ \t]+)[^\n\S]*([A-D])\b/gi;
    let m: RegExpExecArray | null;
    while ((m = p1.exec(targetText)) !== null) {
      const qNum = parseInt(m[1], 10);
      if (!map.has(qNum)) {
        map.set(qNum, m[2].toUpperCase());
      }
    }

    const p2 = /\b(\d+)([A-D])\b/gi;
    while ((m = p2.exec(targetText)) !== null) {
      const qNum = parseInt(m[1], 10);
      if (!map.has(qNum)) {
        map.set(qNum, m[2].toUpperCase());
      }
    }
  }

  // 2. Horizontal table detection (run on full text so Row 1 'Câu' is never lost)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i++) {
    const curLine = lines[i];
    const nextLine = lines[i + 1];
    if (
      /(?:Câu|STT|No)/i.test(curLine) &&
      /(?:Đáp\s*án|Đ\/A|Key|Answer)/i.test(nextLine)
    ) {
      const numMatches = curLine.match(/\b\d+\b/g);
      const cleanNext = nextLine.replace(/^(?:Đáp\s*án|Đ\/A|Key|Answer)[^\t\s]*/i, "");
      const letterMatches = cleanNext.match(/\b[A-D]\b/gi);
      if (numMatches && letterMatches && numMatches.length === letterMatches.length) {
        for (let k = 0; k < numMatches.length; k++) {
          const qNum = parseInt(numMatches[k], 10);
          if (!map.has(qNum)) {
            map.set(qNum, letterMatches[k].toUpperCase());
          }
        }
      }
    }
  }

  return map;
}

// Split entire text into discrete exam chunks
function splitTextIntoExamChunks(rawText: string): { title: string; text: string }[] {
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();

  if (!normalized) return [];

  // Primary Regex matching exam headers:
  // Matches "ĐỀ SỐ 1", "ĐỀ 1", "ĐỀ THI SỐ 02", "ĐỀ 01:", "ĐỀ ÔN TẬP SỐ 1", "MÃ ĐỀ: 101", "BỘ ĐỀ SỐ 1", "EXAM 1"
  const EXAM_HEADER_REGEX =
    /(?:^|\n)(?=\s*(?:[-*#_\[(]*\s*)?(?:ĐỀ|BỘ\s*ĐỀ|MÃ\s*ĐỀ|EXAM|TEST)(?:[^\n\d]{0,40})\d+)/i;

  let rawChunks = normalized
    .split(EXAM_HEADER_REGEX)
    .map((c) => c.trim())
    .filter(Boolean);

  // If the first chunk is a cover page / title banner without exam header or questions, drop it
  if (rawChunks.length > 1) {
    const isFirstHeader = /^(?:[-*#_\[(]*\s*)?(?:ĐỀ|BỘ\s*ĐỀ|MÃ\s*ĐỀ|EXAM|TEST)(?:[^\n\d]{0,40})\d+/i.test(
      rawChunks[0]
    );
    const hasQ1 = /(?:Câu(?:\s+hỏi)?|Question|Bài)\s*1\s*[\.\:\)\-\/]/i.test(rawChunks[0]);
    if (!isFirstHeader && !hasQ1) {
      rawChunks = rawChunks.slice(1);
    }
  }

  // Fallback 1: If regex yielded only 1 chunk but multiple "Câu 1" resets are detected, split by "Câu 1" resets
  if (rawChunks.length <= 1) {
    const câu1Regex = /(?:^|\n)(?=(?:Câu(?:\s+hỏi)?|Question|Bài)\s*1\s*[\.\:\)\-\/])/i;
    const câu1Splits = normalized.split(câu1Regex).map((c) => c.trim()).filter(Boolean);
    if (câu1Splits.length > 1) {
      rawChunks = câu1Splits;
    }
  }

  // Fallback 2: If still only 1 chunk, treat as a single exam
  if (rawChunks.length === 0) {
    rawChunks = [normalized];
  }

  // Format into { title, text } chunks
  return rawChunks.map((chunk, index) => {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    let detectedTitle = `Đề số ${index + 1}`;

    if (lines.length > 0) {
      const firstLine = lines[0];
      if (/^(?:[-*#_\[(]*\s*)?(?:ĐỀ|BỘ\s+ĐỀ|MÃ\s+ĐỀ|EXAM|TEST)/i.test(firstLine)) {
        detectedTitle = cleanExamTitle(firstLine);
        if (
          lines.length > 1 &&
          lines[1].length < 100 &&
          !/^(?:Câu|Question|\d+[\.\)]|Thời\s*gian)/i.test(lines[1])
        ) {
          detectedTitle += ` - ${cleanExamTitle(lines[1])}`;
        }
      }
    }

    return {
      title: detectedTitle,
      text: chunk,
    };
  });
}

// Parse an individual exam chunk intelligently
function parseExamChunkSmart(
  chunkText: string,
  fallbackTitle: string = "Đề thi",
  defaultDuration: number = 45,
  tempIdPrefix: string = "batch_exam"
): {
  title: string;
  durationMinutes: number;
  questions: ParsedQuestionDraft[];
  hasIssues: boolean;
  issuesCount: number;
} {
  let text = chunkText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();

  // Extract any Answer Key Table in this chunk
  const chunkAnswerMap = extractAnswerMapFromSection(text);

  // 1. Separate Header metadata vs Question body
  const firstQMatch = text.search(
    /(?:^|\n)\s*(?:(?:PHẦN|PART|MỤC)\s+[IVX\d]+|(?:Câu(?:\s+hỏi)?|Question|Bài)\s*\d+|(?:CÂU\s*HỎI\s+)?TỰ\s*LUẬN)/i
  );

  let headerText = "";
  let bodyText = text;

  if (firstQMatch > 0) {
    headerText = text.slice(0, firstQMatch).trim();
    bodyText = text.slice(firstQMatch).trim();
  }

  // Extract metadata from header
  let detectedDuration = defaultDuration;
  const durMatch = headerText.match(
    /(?:Thời\s*gian(?:\s*làm\s*bài)?|Thời\s*lượng)[\:\s\-]+(\d+)\s*phút/i
  );
  if (durMatch) {
    detectedDuration = parseInt(durMatch[1], 10);
  }

  let detectedTitle = fallbackTitle;
  if (headerText) {
    const lines = headerText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      detectedTitle = cleanExamTitle(lines[0]);
      if (
        lines.length > 1 &&
        lines[1].length < 100 &&
        !/^(?:Thời\s*gian|Câu|Học\s*kỳ|Mã\s*đề)/i.test(lines[1])
      ) {
        detectedTitle += ` - ${cleanExamTitle(lines[1])}`;
      }
    }
  }

  // 2. Separate MCQ section vs Essay section
  const essaySectionRegex =
    /(?:^|\n)\s*(?=(?:(?:PHẦN|PART|MỤC)\s+(?:II|2|[B-Z])\b.*?(?:TỰ\s*LUẬN|ESSAY)|(?:II|B)[\.\:\-]\s*TỰ\s*LUẬN|(?:CÂU\s*HỎI\s+)?TỰ\s*LUẬN[\:\.\s\-]))/i;

  const essaySplitIdx = bodyText.search(essaySectionRegex);
  let mcqText = bodyText;
  let essayText = "";

  if (essaySplitIdx !== -1) {
    mcqText = bodyText.slice(0, essaySplitIdx).trim();
    essayText = bodyText.slice(essaySplitIdx).trim();
  }

  // Strip answer key section from mcqText so it doesn't get merged into the last MCQ question
  const ansKeyHeaderInMcq = mcqText.search(
    /(?:^|\n)\s*(?:(?:PHẦN|BẢNG|DANH\s*SÁCH|PHIẾU)?\s*(?:ĐÁP\s*ÁN|TRẢ\s*LỜI)(?:\s*TRẮC\s*NGHIỆM|\s*CHI\s*TIẾT)?|HƯỚNG\s*DẪN\s*CHẤM|ANSWER\s*KEYS?|KEYS?)[\:\s\-\n]/i
  );
  if (ansKeyHeaderInMcq !== -1) {
    mcqText = mcqText.slice(0, ansKeyHeaderInMcq).trim();
  }

  const tableHeaderInMcq = mcqText.search(
    /(?:^|\n)\s*(?:Câu|STT|No)\s*[\t\s]+\d+\b[^\n]*\n\s*(?:Đáp\s*án|Đ\/A|Key|Answer)/i
  );
  if (tableHeaderInMcq !== -1) {
    mcqText = mcqText.slice(0, tableHeaderInMcq).trim();
  }

  const questions: ParsedQuestionDraft[] = [];
  let missingCount = 0;

  // 3. Parse MCQ Text
  if (mcqText) {
    const qRegex =
      /(?:^|\n)(?=(?:(?:Câu(?:\s+hỏi)?|Question|Bài)\s*\d+\s*[\.\:\)\-\/]?|\d+\s*[\.\)\/]\s+))/i;
    const blocks = mcqText.split(qRegex).map((b) => b.trim()).filter(Boolean);

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      let contentLines: string[] = [];
      let options: string[] = [];
      let correctAnswer = "";

      const optionRegex = /^([A-D])[\.\:\)]\s*(.+)$/i;
      const answerKeyRegex =
        /^(?:\[|\()? *(?:Đáp\s*án(?:\s*đúng)?|Answer(?:\s*key)?|Key|Đ\/A|ĐA)[\:\s\-]+([A-D])\b/i;
      const asteriskOptionRegex = /^\*\s*([A-D])[\.\:\)]\s*(.+)$/i;

      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];

        // 1. Standalone answer key line (e.g. "Đáp án: A")
        const ansMatch = line.match(answerKeyRegex);
        if (ansMatch) {
          correctAnswer = ansMatch[1].toUpperCase();
          continue;
        }

        // 2. Option marked with asterisk (from bold/underline formatting: e.g. "*C. ...")
        const asteriskMatch = line.match(asteriskOptionRegex);
        if (asteriskMatch) {
          const letter = asteriskMatch[1].toUpperCase();
          let optText = asteriskMatch[2].replace(/\(đáp\s*án\s*đúng\)/gi, "").trim();
          options.push(`${letter}. ${optText}`);
          if (!correctAnswer) correctAnswer = letter;
          continue;
        }

        // 3. Standard option (A. ..., B. ...)
        const optMatch = line.match(optionRegex);
        if (optMatch) {
          const letter = optMatch[1].toUpperCase();
          let optText = optMatch[2].trim();
          if (
            /\(\s*(?:đúng|correct|đáp\s*án\s*đúng)\s*\)$/i.test(optText) ||
            optText.endsWith("*")
          ) {
            optText = optText
              .replace(/\(\s*(?:đúng|correct|đáp\s*án\s*đúng)\s*\)$/i, "")
              .replace(/\*+$/, "")
              .trim();
            if (!correctAnswer) correctAnswer = letter;
          }
          options.push(`${letter}. ${optText}`);
          continue;
        }

        if (options.length === 0) {
          contentLines.push(line);
        } else {
          const trailingAns = line.match(
            /(?:Đáp\s*án(?:\s*đúng)?|Answer|Key|Đ\/A)[\:\s\-]+([A-D])\s*[\]\)]?$/i
          );
          if (trailingAns) {
            correctAnswer = trailingAns[1].toUpperCase();
          } else {
            options[options.length - 1] += ` ${line}`;
          }
        }
      }

      // Check if answer is in the chunk's Answer Table (e.g. Question 1 -> answerMap.get(1))
      const currentQNumber = questions.length + 1;
      if (!correctAnswer && chunkAnswerMap.has(currentQNumber)) {
        correctAnswer = chunkAnswerMap.get(currentQNumber)!;
      }

      const qContent = cleanQuestionContent(contentLines.join("\n"));
      if (qContent || options.length > 0) {
        if (!correctAnswer) missingCount++;
        questions.push({
          id: `q_draft_${tempIdPrefix}_${currentQNumber}`,
          type: "multiple_choice",
          content: qContent || `Câu hỏi số ${currentQNumber}`,
          options: normalizeOptions(options),
          correct_answer: correctAnswer || "", // Keep empty if missing, don't fake with "A"
          max_score: 0.5,
        });
      }
    }
  }

  // 4. Parse Essay Section
  if (essayText) {
    const outlineRegex =
      /(?:^|\n)\s*(?=(?:(?:DÀN\s*Ý|GỢI\s*Ý|HƯỚNG\s*DẪN)\s*(?:TRẢ\s*LỜI|ĐÁP\s*ÁN|CHẤM)?|ĐÁP\s*ÁN(?:\s*TỰ\s*LUẬN|\s*CHI\s*TIẾT)?|YÊU\s*CẦU\s*CẦN\s*ĐẠT)[\:\s\-])/i;

    const outlineMatch = essayText.search(outlineRegex);
    let promptPart = essayText;
    let outlinePart = "";

    if (outlineMatch !== -1) {
      promptPart = essayText.slice(0, outlineMatch).trim();
      outlinePart = essayText.slice(outlineMatch).trim();
    }

    const essayQRegex =
      /(?:^|\n)(?=(?:(?:Câu(?:\s+hỏi)?|Question|Bài)\s*\d+\s*[\.\:\)\-\/]?))/i;
    let essayBlocks = promptPart.split(essayQRegex).map((b) => b.trim()).filter(Boolean);
    if (essayBlocks.length === 0) {
      essayBlocks = [promptPart];
    }

    for (let eIdx = 0; eIdx < essayBlocks.length; eIdx++) {
      const block = essayBlocks[eIdx];
      const cleaned = cleanQuestionContent(block);
      if (!cleaned) continue;

      questions.push({
        id: `q_draft_${tempIdPrefix}_${questions.length + 1}`,
        type: "essay",
        content: cleaned,
        options: [],
        correct_answer: "",
        explanation: outlinePart || undefined,
        max_score: 2.0,
      });
    }
  }

  return {
    title: detectedTitle,
    durationMinutes: detectedDuration,
    questions,
    hasIssues: missingCount > 0,
    issuesCount: missingCount,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const defaultDuration = Number(formData.get("defaultDuration")) || 45;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn tệp Word (.docx) để phân tích." },
        { status: 400 }
      );
    }

    const fileName = file.name || "exams.docx";
    if (!fileName.toLowerCase().endsWith(".docx")) {
      return NextResponse.json(
        { error: "Hệ thống chỉ hỗ trợ định dạng tệp Microsoft Word (.docx)." },
        { status: 400 }
      );
    }

    // 1. Extract text via mammoth convertToHtml (preserves bold, underline, tables, and formatting)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const htmlResult = await mammoth.convertToHtml({ buffer, arrayBuffer } as any);
    const rawText = convertHtmlToMarkedText(htmlResult.value || "").trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "Tệp Word không chứa nội dung văn bản hợp lệ hoặc tệp rỗng." },
        { status: 400 }
      );
    }

    // 2. Split into individual exam chunks
    const chunks = splitTextIntoExamChunks(rawText);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy cấu trúc đề thi nào trong tệp Word này." },
        { status: 400 }
      );
    }

    // 3. Intelligent High-Speed Chunk Parsing
    // Extracts headers, detects bold/underline answers, maps answer key tables, isolates essays
    const parsedExams = chunks.map((chunk, idx) => {
      const tempId = `batch_exam_${Date.now()}_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`;
      const parsed = parseExamChunkSmart(chunk.text, chunk.title, defaultDuration, tempId);

      return {
        tempId,
        title: parsed.title,
        durationMinutes: parsed.durationMinutes,
        questionCount: parsed.questions.length,
        hasIssues: parsed.hasIssues,
        issuesCount: parsed.issuesCount,
        questions: parsed.questions,
      };
    });

    const totalQuestions = parsedExams.reduce((sum, e) => sum + e.questionCount, 0);

    return NextResponse.json({
      success: true,
      fileName,
      totalExams: parsedExams.length,
      totalQuestions,
      exams: parsedExams,
    });
  } catch (error: any) {
    console.error("Batch Exam Split Error:", error);
    return NextResponse.json(
      {
        error:
          "Lỗi trong quá trình tách và phân tích tệp nhiều đề thi: " +
          (error?.message || "Không xác định"),
      },
      { status: 500 }
    );
  }
}
