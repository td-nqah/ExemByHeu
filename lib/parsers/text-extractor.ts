import { ParsedQuestionDraft } from "@/types/exam";

/**
 * Robust regex-based question extractor that parses standard Vietnamese & English exam patterns.
 * Supports:
 * - "Câu 1:", "Question 1:", "1.", "Bài 1:"
 * - Options "A. ...", "B. ...", "C. ...", "D. ..."
 * - Correct answer markers like "Đáp án: A", "Answer: B", "Key: C", or "*A. ..."
 */
export function parseQuestionsFromRawText(rawText: string): ParsedQuestionDraft[] {
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalized) return [];

  // Split into chunks based on question headers
  // E.g. "Câu 1:", "Câu 1.", "Question 1:", "1.", "1/"
  const questionHeaderRegex = /(?:^|\n)(?=(?:Câu|Question|Bài|\d+[\.\)])\s*\d*[\.:\s])/i;
  const rawBlocks = normalized.split(questionHeaderRegex).map((b) => b.trim()).filter(Boolean);

  const results: ParsedQuestionDraft[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let questionContent = "";
    const options: string[] = [];
    let correctAnswer = "";
    let isAnswerKeyFound = false;

    // Scan lines
    const optionRegex = /^([A-D])[\.\:\)]\s*(.*)$/i;
    const answerKeyRegex = /(?:Đáp\s*án|Answer|Key|Đ\/A)[\:\s]+([A-D])/i;
    const asteriskOptionRegex = /^\*([A-D])[\.\:\)]\s*(.*)$/i;

    const contentLines: string[] = [];

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];

      // Check if line contains answer key specification (e.g. "Đáp án: A")
      const answerMatch = line.match(answerKeyRegex);
      if (answerMatch) {
        correctAnswer = answerMatch[1].toUpperCase();
        isAnswerKeyFound = true;
        continue;
      }

      // Check if option starts with asterisk for correct answer (e.g. "*A. ...")
      const asteriskMatch = line.match(asteriskOptionRegex);
      if (asteriskMatch) {
        const letter = asteriskMatch[1].toUpperCase();
        const optionText = `${letter}. ${asteriskMatch[2]}`;
        options.push(optionText);
        if (!correctAnswer) {
          correctAnswer = letter;
        }
        continue;
      }

      // Check if standard option (e.g. "A. ...", "B. ...")
      const optionMatch = line.match(optionRegex);
      if (optionMatch) {
        const letter = optionMatch[1].toUpperCase();
        const optionText = `${letter}. ${optionMatch[2]}`;
        options.push(optionText);
        continue;
      }

      // If we haven't seen any options yet, it's part of the question content
      if (options.length === 0) {
        contentLines.push(line);
      } else {
        // Line following an option might be multi-line option text
        if (options.length > 0) {
          options[options.length - 1] += ` ${line}`;
        }
      }
    }

    questionContent = contentLines.join("\n").trim();

    // Clean question header prefix like "Câu 1: " or "1. " if present
    const cleanedContent = questionContent
      .replace(/^(?:Câu|Question|Bài)\s*\d+[\.:\s]*/i, "")
      .replace(/^\d+[\.\)]\s*/, "")
      .trim();

    const finalContent = cleanedContent || questionContent || `Câu hỏi ${i + 1}`;

    const isMCQ = options.length >= 2;
    const type = isMCQ ? "multiple_choice" : "essay";

    results.push({
      id: `draft_${Date.now()}_${i + 1}`,
      type,
      content: finalContent,
      options: isMCQ ? options : [],
      correct_answer: isMCQ ? (correctAnswer || "A") : "",
      max_score: isMCQ ? 2.0 : 4.0,
    });
  }

  // Fallback: If no structured blocks matched, create at least 1 draft question from the text
  if (results.length === 0 && normalized.length > 0) {
    results.push({
      id: `draft_${Date.now()}_1`,
      type: "essay",
      content: normalized.slice(0, 500),
      options: [],
      correct_answer: "",
      max_score: 5.0,
    });
  }

  return results;
}
