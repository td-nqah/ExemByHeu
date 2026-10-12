import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  getServerGeminiApiKey,
  getCandidateGeminiModels,
} from "@/lib/gemini-server";

// Cache working model in server memory to avoid repeated round-trips
let cachedWorkingModel: string | null = null;

function compressText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Regex / Markdown fallback parser when Gemini AI is not configured or fails.
 */
function fallbackParseMaterial(
  rawText: string,
  titleHint?: string
): {
  title: string;
  summary: string;
  reading_time: number;
  content_html: string;
} {
  const lines = rawText.split("\n");
  let detectedTitle = titleHint?.trim() || "";
  const bodyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!detectedTitle && /^#\s+(.+)$/.test(line)) {
      detectedTitle = line.replace(/^#\s+/, "").trim();
      continue;
    }
    if (!detectedTitle && /^Tiêu đề:\s*(.+)$/i.test(line)) {
      detectedTitle = line.replace(/^Tiêu đề:\s*/i, "").trim();
      continue;
    }
    bodyLines.push(lines[i]);
  }

  if (!detectedTitle) {
    const firstLine = lines.find((l) => l.trim().length > 3) || "Tài liệu học tập";
    detectedTitle = firstLine.replace(/^[#*-\s]+/, "").slice(0, 80).trim();
  }

  // Calculate words and reading time
  const allWords = rawText.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(allWords / 180));

  // Build summary from the beginning
  const nonHeaderParagraphs = bodyLines
    .filter((l) => l.trim().length > 20 && !l.trim().startsWith("#") && !l.trim().startsWith("|"))
    .slice(0, 2);
  const summary =
    nonHeaderParagraphs.length > 0
      ? nonHeaderParagraphs.join(" ").slice(0, 220).trim() + "..."
      : `Tổng hợp kiến thức trọng tâm cho chuyên đề ${detectedTitle}.`;

  // Convert markdown lines to Magazine HTML
  let html = "";
  let inList = false;
  let inTable = false;
  let tableHeaderDone = false;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();

    if (!line) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      if (inTable) {
        html += "</tbody></table></div>\n";
        inTable = false;
        tableHeaderDone = false;
      }
      continue;
    }

    // Markdown Table
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      // Check if separator line
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        tableHeaderDone = true;
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderDone = false;
        html += `<div class="overflow-x-auto my-6 rounded-xl border border-white/10 bg-[#141829]/50 shadow-sm"><table class="w-full text-left text-xs sm:text-sm"><thead><tr class="bg-indigo-950/60 text-indigo-200 border-b border-white/10">`;
        cells.forEach((c) => {
          html += `<th class="p-3 font-semibold">${c}</th>`;
        });
        html += `</tr></thead><tbody class="divide-y divide-white/5 text-slate-300">`;
      } else {
        html += `<tr class="hover:bg-white/[0.02]">`;
        cells.forEach((c, idx) => {
          const isFirst = idx === 0;
          html += `<td class="p-3 ${isFirst ? "font-mono font-medium text-slate-200" : ""}">${c}</td>`;
        });
        html += `</tr>`;
      }
      continue;
    }

    // Close table if open and line is not table
    if (inTable) {
      html += "</tbody></table></div>\n";
      inTable = false;
      tableHeaderDone = false;
    }

    // Headings
    if (/^###\s+(.+)$/.test(line)) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      const title = line.replace(/^###\s+/, "").trim();
      html += `<h3>${title}</h3>\n`;
      continue;
    }

    if (/^##\s+(.+)$/.test(line)) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      const title = line.replace(/^##\s+/, "").trim();
      html += `<h2>${title}</h2>\n`;
      continue;
    }

    if (/^#\s+(.+)$/.test(line)) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      const title = line.replace(/^#\s+/, "").trim();
      html += `<h2>${title}</h2>\n`;
      continue;
    }

    // Callout Box (> or [Lưu ý] or [Mẹo ôn thi])
    if (
      line.startsWith(">") ||
      /^(?:Lưu ý|Ghi chú|Mẹo ôn thi|Quan trọng):/i.test(line)
    ) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      const calloutContent = line
        .replace(/^>\s*/, "")
        .replace(/^(?:Lưu ý|Ghi chú|Mẹo ôn thi|Quan trọng):\s*/i, "")
        .trim();

      const isWarning = /nguy hiểm|sai lầm|chú ý|cảnh báo/i.test(line);
      const isTip = /mẹo|bí quyết|kinh nghiệm/i.test(line);

      const colorClass = isWarning
        ? "border-amber-500 bg-amber-950/30 text-amber-100"
        : isTip
        ? "border-emerald-500 bg-emerald-950/30 text-emerald-100"
        : "border-[#5852d6] bg-indigo-950/30 text-indigo-100";

      const titleLabel = isWarning
        ? "CẢNH BÁO QUAN TRỌNG"
        : isTip
        ? "MẸO GHI NHỚ NHANH"
        : "ĐIỂM CỐT LÕI";

      html += `<div class="callout-box border-l-4 ${colorClass} p-4 rounded-r-xl my-4 text-xs sm:text-sm">
        <p class="font-bold tracking-wide text-xs mb-1 uppercase opacity-90">${titleLabel}</p>
        <p class="leading-relaxed opacity-95">${calloutContent}</p>
      </div>\n`;
      continue;
    }

    // List Items
    if (/^[*-]\s+(.+)$/.test(line) || /^\d+\.\s+(.+)$/.test(line)) {
      const itemContent = line.replace(/^[*-]\s+/, "").replace(/^\d+\.\s+/, "");
      if (!inList) {
        inList = true;
        html += `<ul class="list-disc pl-5 space-y-1.5 my-3 text-slate-300 text-xs sm:text-sm">\n`;
      }
      const formatted = itemContent.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      html += `  <li>${formatted}</li>\n`;
      continue;
    }

    // Regular Paragraph
    if (inList) {
      html += "</ul>\n";
      inList = false;
    }

    const formattedPara = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, '<code class="bg-[#1e2538] text-indigo-300 px-1 py-0.5 rounded text-xs font-mono">$1</code>');

    html += `<p class="leading-relaxed text-slate-300 mb-4 text-xs sm:text-sm">${formattedPara}</p>\n`;
  }

  if (inList) html += "</ul>\n";
  if (inTable) html += "</tbody></table></div>\n";

  return {
    title: detectedTitle,
    summary,
    reading_time: readingTime,
    content_html: html,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawText = compressText(String(body?.rawText || ""));
    const titleHint = String(body?.titleHint || "").trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "Nội dung văn bản tài liệu đang trống." },
        { status: 400 }
      );
    }

    const apiKey = getServerGeminiApiKey();

    // 1. If GEMINI_API_KEY is not configured, immediately use traditional fallback parser
    if (!apiKey) {
      const fallback = fallbackParseMaterial(rawText, titleHint);
      return NextResponse.json({
        ...fallback,
        mode: "fallback",
        reason: "Chưa cấu hình GEMINI_API_KEY, hệ thống dùng bộ phân tích định dạng tự động.",
      });
    }

    // 2. Call Google Gemini AI
    const ai = new GoogleGenAI({ apiKey });
    const candidateModels = getCandidateGeminiModels(cachedWorkingModel);

    const prompt = `Bạn là chuyên gia biên tập học liệu và xuất bản tạp chí công nghệ cao cấp (Tech Magazine Editor).
Nhiệm vụ: Chuyển đổi toàn bộ tài liệu thô được cung cấp thành một bài viết Tạp chí học tập hiện đại, trực quan, chuyên sâu bằng định dạng JSON chuẩn.

Yêu cầu xuất ra JSON duy nhất với cấu trúc:
{
  "title": "Tiêu đề bài viết ngắn gọn, hấp dẫn, chuẩn phong cách tạp chí",
  "summary": "Đoạn tóm tắt mở đầu 1-3 câu (50-100 từ) cô đọng giá trị cốt lõi nhất",
  "reading_time": 5, // Số phút đọc ước tính (số nguyên dương)
  "content_html": "<section>...nội dung HTML tạp chí...</section>"
}

Quy tắc biên tập "content_html":
1. Chia bài viết thành các mục lớn bằng thẻ <h2> (Bắt buộc dùng <h2> cho tiêu đề mục chính để hệ thống tự tạo Mục lục Table of Contents).
2. Các tiểu mục dùng thẻ <h3>.
3. Các đoạn văn dùng thẻ <p class="leading-relaxed text-slate-300 mb-4 text-sm sm:text-base">.
4. Lồng ghép các khung điểm nhấn Callout Box phong cách Cyber:
   - Điểm cốt lõi: <div class="callout-box border-l-4 border-[#5852d6] bg-indigo-950/30 p-4 rounded-r-xl my-4 text-indigo-100 text-sm"><p class="font-bold uppercase tracking-wider text-xs mb-1">Cốt lõi</p><p>...</p></div>
   - Mẹo thi/Ghi nhớ: <div class="callout-box border-l-4 border-emerald-500 bg-emerald-950/30 p-4 rounded-r-xl my-4 text-emerald-100 text-sm"><p class="font-bold uppercase tracking-wider text-xs mb-1">Mẹo Ôn Thi</p><p>...</p></div>
   - Cảnh báo/Bẫy đề thi: <div class="callout-box border-l-4 border-amber-500 bg-amber-950/30 p-4 rounded-r-xl my-4 text-amber-100 text-sm"><p class="font-bold uppercase tracking-wider text-xs mb-1">Cảnh Báo Hay Nhầm Lẫn</p><p>...</p></div>
5. Nếu có so sánh, phân loại hoặc dữ liệu, BẮT BUỘC trình bày dạng bảng HTML:
   <div class="overflow-x-auto my-6 rounded-xl border border-white/10 bg-[#141829]/50"><table class="w-full text-left text-xs sm:text-sm"><thead><tr class="bg-indigo-950/60 text-indigo-200 border-b border-white/10"><th class="p-3">Tiêu chí</th><th class="p-3">...</th></tr></thead><tbody class="divide-y divide-white/5 text-slate-300"><tr class="hover:bg-white/[0.02]"><td class="p-3 font-mono font-medium text-slate-200">...</td><td class="p-3">...</td></tr></tbody></table></div>
6. Danh sách liệt kê: <ul class="list-disc pl-5 space-y-1.5 my-3 text-slate-300 text-xs sm:text-sm"><li>...</li></ul>
7. Từ khóa quan trọng in đậm bằng <strong>.

Tiêu đề gợi ý (nếu có): ${titleHint || "Không có"}
TÀI LIỆU CẦN XỬ LÝ:
${rawText.slice(0, 32000)}`;

    let parsedResult: any = null;
    let activeModel = "";

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const text = (response.text || "").trim();
        const cleanedJson = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();

        const json = JSON.parse(cleanedJson);
        if (json && json.content_html && json.title) {
          parsedResult = json;
          activeModel = modelName;
          cachedWorkingModel = modelName;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (parsedResult) {
      return NextResponse.json({
        title: parsedResult.title || titleHint || "Tài liệu học tập",
        summary: parsedResult.summary || "",
        reading_time: Number(parsedResult.reading_time) || 5,
        content_html: parsedResult.content_html,
        mode: "ai",
        model: activeModel,
      });
    }

    // Fallback if all models failed or empty
    const fallback = fallbackParseMaterial(rawText, titleHint);
    return NextResponse.json({
      ...fallback,
      mode: "fallback",
      reason: "AI không phản hồi kịp thời, hệ thống đã cấu trúc bài viết theo bộ dựng tự động.",
    });
  } catch (error: any) {
    console.error("Error in parse-material API:", error);
    return NextResponse.json(
      { error: error?.message || "Không thể phân tích tài liệu" },
      { status: 500 }
    );
  }
}
