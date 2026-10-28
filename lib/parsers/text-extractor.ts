import { ParsedQuestionDraft } from "@/types/exam";

/**
 * Normalize inline options (e.g., "A. Opt 1   B. Opt 2   C. Opt 3   D. Opt 4" on a single line)
 * into separate lines so the line-by-line parser can extract them cleanly.
 */
function splitInlineOptions(line: string): string[] {
  // Check if line contains multiple option markers like A. ... B. ...
  const inlinePattern = /(?:^|\s+)(?=\*?[A-D][\.\:\)]\s+)/g;
  const parts = line
    .split(inlinePattern)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2 && parts.every((p) => /^\*?[A-D][\.\:\)]\s+/i.test(p))) {
    return parts;
  }
  return [line];
}

// Extract Answer Key Table / List (e.g. "1. C  2. D", "1-C  2-D", "1C  2D", "C1 ... \n A ...", or horizontal/vertical table)
function extractAnswerMapFromText(text: string): Map<number, string> {
  const map = new Map<number, string>();
  if (!text) return map;

  const answerKeyHeaderRegex =
    /(?:^|\n)\s*(?:(?:PHẦN|BẢNG|DANH\s*SÁCH|PHIẾU)?\s*(?:ĐÁP\s*ÁN|TRẢ\s*LỜI)(?:\s*TRẮC\s*NGHIỆM|\s*CHI\s*TIẾT)?|HƯỚNG\s*DẪN\s*CHẤM|ANSWER\s*KEYS?|KEYS?)[-:\s\n]/iu;

  const headerIdx = text.search(answerKeyHeaderRegex);
  const targetText = headerIdx !== -1 ? text.slice(headerIdx) : text;

  // 1. Grid/Table row pairing: Lines of question indices (C1, C2, ... or 1, 2, ...) followed by lines of letters (A, B, C, D)
  const lines = targetText.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i++) {
    const curLine = lines[i];
    const nextLine = lines[i + 1];

    // Split by tab or multiple spaces
    const numTokens = curLine.split(/[\t\s]+/).filter(Boolean);
    const parsedNums = numTokens
      .map((tok) => {
        const m = tok.match(/^(?:C|Câu|STT|No)?\.?\s*(\d+)$/i);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n): n is number => n !== null);

    const letterTokens = nextLine.split(/[\t\s]+/).filter(Boolean);
    const parsedLetters = letterTokens
      .map((tok) => {
        const m = tok.match(/^(?<!\p{L})([A-D])(?!\p{L})$/iu);
        return m ? m[1].toUpperCase() : null;
      })
      .filter((l): l is string => Boolean(l));

    // If both lines have at least 2 items and equal counts of numbers and letters
    if (
      parsedNums.length >= 2 &&
      parsedLetters.length >= 2 &&
      parsedNums.length === parsedLetters.length
    ) {
      for (let k = 0; k < parsedNums.length; k++) {
        if (!map.has(parsedNums[k])) {
          map.set(parsedNums[k], parsedLetters[k]);
        }
      }
    }
  }

  // 2. Pattern 1: Inline pairs e.g. "1. A", "Câu 1: A", "1 - A", "1:A"
  const p1 = /(?:Câu\s*|C)?(\d+)[^\n\S]*(?:[-.:\/]|[ \t]+)[^\n\S]*(?<!\p{L})([A-D])(?!\p{L})/giu;
  let m: RegExpExecArray | null;
  while ((m = p1.exec(targetText)) !== null) {
    const qNum = parseInt(m[1], 10);
    if (!map.has(qNum)) {
      map.set(qNum, m[2].toUpperCase());
    }
  }

  // 3. Pattern 2: Compact pairs e.g. "1A", "2C", "3B", "C1A", "C2C"
  const p2 = /(?:^|\s)(?:C|Câu)?(\d+)([A-D])(?!\p{L})/giu;
  while ((m = p2.exec(targetText)) !== null) {
    const qNum = parseInt(m[1], 10);
    if (!map.has(qNum)) {
      map.set(qNum, m[2].toUpperCase());
    }
  }

  return map;
}

/**
 * Robust regex-based question extractor that parses standard & semi-structured Vietnamese & English exam patterns.
 * Supports:
 * - "Câu 1:", "Câu hỏi 1.", "Question 1:", "1.", "1)", "Bài 1:"
 * - Inline or multiline options "A. ...", "B. ...", "C. ...", "D. ..."
 * - Correct answer markers like "Đáp án: A", "Đáp án đúng: B", "Answer: C", "Key: D", or "*A. ..."
 * - Point/score markers like "(2 điểm)", "(0.5đ)", "[2.5 pts]"
 */
export function parseQuestionsFromRawText(rawText: string): ParsedQuestionDraft[] {
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();

  if (!normalized) return [];

  // Extract answer map if an answer table is present at the end
  const answerMap = extractAnswerMapFromText(normalized);

  // Strip answer key section from exam text so it never becomes a question or merges into questions
  const answerKeyHeaderRegex =
    /(?:^|\n)\s*(?:(?:PHẦN|BẢNG|DANH\s*SÁCH|PHIẾU)?\s*(?:ĐÁP\s*ÁN|TRẢ\s*LỜI)(?:\s*TRẮC\s*NGHIỆM|\s*CHI\s*TIẾT)?|HƯỚNG\s*DẪN\s*CHẤM|ANSWER\s*KEYS?|KEYS?)[-:\s\n]/iu;
  const headerIdx = normalized.search(answerKeyHeaderRegex);
  let examBody = normalized;
  if (headerIdx !== -1) {
    examBody = normalized.slice(0, headerIdx).trim();
  }

  // Remove standalone section headers like "PHẦN I: TRẮC NGHIỆM", "PHẦN II: TỰ LUẬN" from merging into questions
  const cleanedRaw = examBody.replace(
    /^(?:PHẦN|PART|MỤC)\s+[IVX\d]+[\.\:\-\s]+.*$/gim,
    "\n"
  );

  // Split into chunks based on question headers
  // E.g. "Câu 1:", "Câu hỏi 1:", "Câu hỏi tự luận:", "Question 1:", "Bài 1:", "1.", "1)"
  const questionHeaderRegex =
    /(?:^|\n)(?=(?:(?:Câu(?:\s+hỏi)?|Question|Bài)\s*(?:\d+|tự\s*luận)\b[\.\:\)\-\/]?|\d+\s*[\.\)\/]\s+|(?:CÂU\s*HỎI\s+)?TỰ\s*LUẬN[\:\.\s\-]))/i;

  let rawBlocks = cleanedRaw
    .split(questionHeaderRegex)
    .map((b) => b.trim())
    .filter(Boolean);

  // If no numbered headers matched, try splitting by double newline paragraphs
  if (rawBlocks.length <= 1 && cleanedRaw.includes("\n\n")) {
    const paragraphBlocks = cleanedRaw
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter((b) => b.length > 10);
    if (paragraphBlocks.length > 1) {
      rawBlocks = paragraphBlocks;
    }
  }

  const results: ParsedQuestionDraft[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    const rawLines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (rawLines.length === 0) continue;

    // Expand any inline options (e.g., "A. ... B. ... C. ... D. ...")
    const lines: string[] = [];
    for (const rl of rawLines) {
      lines.push(...splitInlineOptions(rl));
    }

    let questionContent = "";
    const options: string[] = [];
    let correctAnswer = "";

    const optionRegex = /^([A-D])[\.\:\)]\s*(.+)$/i;
    const answerKeyRegex =
      /^(?:\[|\()? *(?:Đáp\s*án(?:\s*đúng)?|Answer(?:\s*key)?|Key|Đ\/A|ĐA)[\:\s\-]+([A-D])\b/i;
    const inlineAnswerEndRegex =
      /(?:Đáp\s*án(?:\s*đúng)?|Answer|Key|Đ\/A)[\:\s\-]+([A-D])\s*[\]\)]?$/i;
    const asteriskOptionRegex = /^\*\s*([A-D])[\.\:\)]\s*(.+)$/i;

    const contentLines: string[] = [];

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];

      // 1. Standalone answer key line (e.g. "Đáp án: A" or "Answer: B")
      const answerMatch = line.match(answerKeyRegex);
      if (answerMatch) {
        correctAnswer = answerMatch[1].toUpperCase();
        continue;
      }

      // 2. Option starting with asterisk for correct answer (e.g. "*A. ...")
      const asteriskMatch = line.match(asteriskOptionRegex);
      if (asteriskMatch) {
        const letter = asteriskMatch[1].toUpperCase();
        const optionText = `${letter}. ${asteriskMatch[2].trim()}`;
        options.push(optionText);
        if (!correctAnswer) {
          correctAnswer = letter;
        }
        continue;
      }

      // 3. Standard option (e.g. "A. ...", "B) ...")
      const optionMatch = line.match(optionRegex);
      if (optionMatch) {
        const letter = optionMatch[1].toUpperCase();
        let optBody = optionMatch[2].trim();

        // Check if option has trailing "(Đáp án đúng)" or "*"
        if (/\(\s*(?:đúng|correct)\s*\)$/i.test(optBody) || optBody.endsWith("*")) {
          optBody = optBody
            .replace(/\(\s*(?:đúng|correct)\s*\)$/i, "")
            .replace(/\*+$/, "")
            .trim();
          if (!correctAnswer) {
            correctAnswer = letter;
          }
        }

        const optionText = `${letter}. ${optBody}`;
        options.push(optionText);
        continue;
      }

      // 4. Question content or continuation of previous option
      if (options.length === 0) {
        contentLines.push(line);
      } else {
        const inlineAns = line.match(inlineAnswerEndRegex);
        if (inlineAns) {
          correctAnswer = inlineAns[1].toUpperCase();
        } else {
          options[options.length - 1] += ` ${line}`;
        }
      }
    }

    questionContent = contentLines.join("\n").trim();

    // Extract score hint if present, e.g. "(2 điểm)", "(0.5đ)", "[3 pts]"
    let detectedScore: number | null = null;
    const scoreHintRegex = /[\(\[]\s*(\d+(?:[\.,]\d+)?)\s*(?:điểm|đ|pts|points)\s*[\)\]]/i;
    const scoreMatch = questionContent.match(scoreHintRegex);
    if (scoreMatch) {
      const parsedVal = parseFloat(scoreMatch[1].replace(",", "."));
      if (!isNaN(parsedVal) && parsedVal > 0) {
        detectedScore = parsedVal;
      }
      questionContent = questionContent.replace(scoreHintRegex, "").trim();
    }

    // Clean question header prefix like "Câu 1: " or "Câu hỏi tự luận: " if present
    const cleanedContent = questionContent
      .replace(/^(?:(?:Câu(?:\s+hỏi)?|Question|Bài)\s*(?:\d+|tự\s*luận)?|(?:CÂU\s*HỎI\s+)?TỰ\s*LUẬN)\s*[\.\:\)\-\/]*\s*/i, "")
      .replace(/^\d+\s*[\.\)\/]\s*/, "")
      .trim();

    const finalContent = cleanedContent || questionContent || `Câu hỏi ${i + 1}`;

    const isMCQ = options.length >= 2;
    const type = isMCQ ? "multiple_choice" : "essay";

    // Normalize options to A, B, C, D prefix
    const normalizedOptions = isMCQ
      ? options.map((opt, idx) => {
          const prefix = String.fromCharCode(65 + idx);
          if (/^[A-Z][\.\:\)]\s+/i.test(opt)) {
            return opt.replace(/^([A-Z])[\.\:\)]\s+/i, (_, l) => `${l.toUpperCase()}. `);
          }
          return `${prefix}. ${opt}`;
        })
      : [];

    const currentQNumber = results.length + 1;
    if (!correctAnswer && answerMap.has(currentQNumber)) {
      correctAnswer = answerMap.get(currentQNumber)!;
    }

    results.push({
      id: `draft_${Date.now()}_${i + 1}`,
      type,
      content: finalContent,
      options: normalizedOptions,
      correct_answer: isMCQ ? correctAnswer || "" : "",
      max_score: detectedScore ?? (isMCQ ? 0.5 : 2.0),
    });
  }

  // Fallback: If no structured blocks matched, create at least 1 draft question from the text
  if (results.length === 0 && normalized.length > 0) {
    results.push({
      id: `draft_${Date.now()}_1`,
      type: "essay",
      content: normalized.slice(0, 1000),
      options: [],
      correct_answer: "",
      max_score: 2.0,
    });
  }

  return results;
}

