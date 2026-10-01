import { Novel, Chapter } from '../types/novel';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to sanitize filename so it matches the chapter name cleanly
export function sanitizeFilename(name: string): string {
  return (name || 'فصل')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_');
}

// Helper to trigger browser download for both String and Blob types
function downloadBlob(content: string | Blob, filename: string, mimeType: string) {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==============================================================
// 1. Direct Chapter PDF Export (Isolated Canvas & jsPDF to avoid oklch)
// ==============================================================
export async function exportChapterToPdf(
  chapter: Chapter,
  novel: Novel,
  customStyles: { font?: string; pageSize?: string; fontSize?: number } = {
    font: 'amiri',
    pageSize: 'A4',
    fontSize: 12,
  }
): Promise<boolean> {
  const filename = sanitizeFilename(chapter.title || 'فصل');
  const fontName =
    customStyles.font === 'scheherazade'
      ? "'Scheherazade New', 'Amiri', serif"
      : customStyles.font === 'cairo'
        ? "'Cairo', sans-serif"
        : "'Amiri', 'Traditional Arabic', serif";

  const paragraphsHtml = (chapter.content || '')
    .split('\n\n')
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; text-indent: 2.2em; line-height: 2.2; text-align: justify; text-justify: inter-word; color: #1c1917;">${p.replace(
          /\n/g,
          '<br/>'
        )}</p>`
    )
    .join('');

  // Create an isolated hidden iframe so html2canvas doesn't encounter Tailwind v4's oklch variables
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  iframe.style.width = customStyles.pageSize === 'A5' ? '600px' : '800px';
  iframe.style.height = '1200px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
    return false;
  }

  const iframeContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      direction: rtl;
      background: #ffffff;
      color: #1c1917;
      font-family: ${fontName};
      font-size: ${(customStyles.fontSize || 12) * 1.3}px;
      line-height: 2.1;
      padding: 44px 50px;
      width: 100%;
    }
    .header-box {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e7e5e4;
    }
    .novel-badge {
      font-size: 14px;
      color: #b45309;
      margin-bottom: 8px;
      font-weight: bold;
    }
    .chapter-main-title {
      font-size: 26px;
      font-weight: bold;
      color: #1c1917;
      margin: 0 0 8px 0;
      line-height: 1.35;
    }
    .chapter-act-name {
      font-size: 14px;
      color: #78716c;
      font-style: italic;
      margin-bottom: 8px;
    }
    .author-signature {
      font-size: 13px;
      color: #57534e;
    }
    .content-flow {
      direction: rtl;
      color: #1c1917;
    }
    .end-ornament {
      text-align: center;
      margin-top: 40px;
      margin-bottom: 20px;
      color: #b45309;
      font-size: 20px;
      letter-spacing: 0.3em;
    }
  </style>
</head>
<body dir="rtl">
  <div class="header-box">
    <div class="novel-badge">${novel.title || 'رواية'}</div>
    <h1 class="chapter-main-title">${chapter.title || 'فصل بدون عنوان'}</h1>
    ${chapter.act ? `<div class="chapter-act-name">${chapter.act}</div>` : ''}
    <div class="author-signature">تأليف: <strong>${novel.author || 'المؤلف'}</strong></div>
  </div>

  <div class="content-flow">
    ${paragraphsHtml || '<p style="text-align: center; color: #888888;">لا يوجد نص في هذا الفصل.</p>'}
  </div>

  <div class="end-ornament">❦ ✦ ❦</div>
</body>
</html>`;

  iframeDoc.open();
  iframeDoc.write(iframeContent);
  iframeDoc.close();

  try {
    // Wait for Google fonts to load inside the iframe
    if (iframeDoc.fonts) {
      await iframeDoc.fonts.ready;
    }
    // Small timeout for layout stabilization
    await new Promise((resolve) => setTimeout(resolve, 300));

    const targetElement = iframeDoc.body;

    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const format =
      customStyles.pageSize === '6x9'
        ? [152, 228]
        : customStyles.pageSize === 'A5'
          ? 'a5'
          : 'a4';

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: format,
    });

    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfPageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfPageHeight;

    // Add subsequent pages if chapter content exceeds one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfPageHeight;
    }

    const pdfBlob = pdf.output('blob');
    downloadBlob(pdfBlob, `${filename}.pdf`, 'application/pdf');
    return true;
  } catch (err) {
    console.error('PDF Generation error:', err);
    return false;
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}

// ==========================================
// 2. Direct Chapter Word (DOCX) Export
// ==========================================
export function exportChapterToWord(chapter: Chapter, novel: Novel) {
  const filename = sanitizeFilename(chapter.title || 'فصل');
  const paragraphsHtml = (chapter.content || '')
    .split('\n\n')
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p style="margin: 0 0 14pt 0; text-indent: 1.8em; line-height: 2.1; font-size: 13pt;">${p.replace(
          /\n/g,
          '<br/>'
        )}</p>`
    )
    .join('');

  const wordDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 2.5cm 2cm 2.5cm 2cm;
        }
        body {
          direction: rtl;
          font-family: 'Amiri', 'Traditional Arabic', serif;
          font-size: 13pt;
          line-height: 2.1;
          color: #1c1917;
          background: #ffffff;
          text-align: justify;
        }
      </style>
    </head>
    <body dir="rtl">
      <div style="text-align: center; margin-bottom: 30pt; padding-bottom: 18pt; border-bottom: 1.5pt solid #d6d3d1;">
        <p style="font-size: 12pt; color: #b45309; margin: 0 0 6pt 0;">${novel.title || 'رواية'}</p>
        <h1 style="font-size: 24pt; font-weight: bold; margin: 0 0 8pt 0; color: #1c1917;">${chapter.title || 'فصل'}</h1>
        ${chapter.act ? `<p style="font-size: 12pt; font-style: italic; color: #78716c; margin: 0 0 8pt 0;">${chapter.act}</p>` : ''}
        <p style="font-size: 11pt; color: #57534e; margin: 0;">الكاتب: ${novel.author || 'المؤلف'}</p>
      </div>
      <div>
        ${paragraphsHtml || '<p>لا يوجد محتوى في هذا الفصل.</p>'}
      </div>
      <p style="text-align: center; font-size: 16pt; color: #b45309; margin-top: 30pt;">❦ ✦ ❦</p>
    </body>
    </html>
  `;

  downloadBlob(
    wordDoc,
    `${filename}.docx`,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

// ==========================================
// 3. Direct Chapter Plain Text (TXT) Export
// ==========================================
export function exportChapterToTxt(chapter: Chapter, novel: Novel) {
  const filename = sanitizeFilename(chapter.title || 'فصل');
  let text = `=====================================\n`;
  text += `${novel.title} - ${novel.author}\n`;
  text += `${chapter.title || 'فصل'}\n`;
  if (chapter.act) text += `(${chapter.act})\n`;
  text += `=====================================\n\n`;
  text += chapter.content || '';
  text += `\n\n❦ ❦ ❦\n`;

  downloadBlob(text, `${filename}.txt`, 'text/plain');
}

// ==========================================
// 4. Direct Chapter eBook / HTML Export
// ==========================================
export function exportChapterToEpubHtml(chapter: Chapter, novel: Novel) {
  const filename = sanitizeFilename(chapter.title || 'فصل');
  const paragraphsHtml = (chapter.content || '')
    .split('\n\n')
    .filter((p) => p.trim())
    .map((p) => `<p style="margin-bottom: 1.25rem;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${chapter.title} - ${novel.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
  <style>
    body {
      direction: rtl;
      font-family: 'Amiri', serif;
      background: #fafaf9;
      color: #1c1917;
      max-width: 760px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      line-height: 2.2;
      text-align: justify;
    }
    .header {
      text-align: center;
      padding-bottom: 2rem;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid #e7e5e4;
    }
    .novel-badge {
      font-size: 1.1rem;
      color: #b45309;
      margin-bottom: 0.5rem;
    }
    h1 {
      font-size: 2.2rem;
      margin: 0.5rem 0;
      color: #1c1917;
    }
    .meta {
      font-size: 1rem;
      color: #78716c;
      margin-top: 1rem;
    }
    .content p {
      text-indent: 1.5rem;
      margin-bottom: 1.25rem;
    }
    .ornament {
      text-align: center;
      color: #b45309;
      font-size: 1.5rem;
      margin-top: 3rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="novel-badge">${novel.title}</div>
    <h1>${chapter.title || 'فصل بدون عنوان'}</h1>
    ${chapter.act ? `<p style="color: #78716c; font-style: italic;">${chapter.act}</p>` : ''}
    <div class="meta">تأليف: <strong>${novel.author}</strong></div>
  </div>
  <div class="content">
    ${paragraphsHtml || '<p>لا يوجد محتوى في هذا الفصل.</p>'}
  </div>
  <div class="ornament">❦ ✦ ❦</div>
</body>
</html>`;

  downloadBlob(html, `${filename}.html`, 'text/html');
}

// ==========================================
// 5. Direct Chapter Markdown (MD) Export
// ==========================================
export function exportChapterToMarkdown(chapter: Chapter, novel: Novel) {
  const filename = sanitizeFilename(chapter.title || 'فصل');
  let md = `---
title: "${chapter.title}"
novel: "${novel.title}"
author: "${novel.author}"
exportedAt: "${new Date().toISOString()}"
---

# ${chapter.title}
${chapter.act ? `*${chapter.act}*\n` : ''}
**الرواية:** ${novel.title} | **المؤلف:** ${novel.author}

---

${chapter.content || ''}

---
*❦ ✦ ❦*
`;

  downloadBlob(md, `${filename}.md`, 'text/markdown');
}

// ==========================================
// Full Novel Legacy & Backup Utilities
// ==========================================
export function exportToJson(novel: Novel) {
  const jsonStr = JSON.stringify(novel, null, 2);
  downloadBlob(
    jsonStr,
    `${novel.title.replace(/\s+/g, '_')}_مشروع_راوي.json`,
    'application/json'
  );
}

export function exportToTxt(novel: Novel, chapterId?: string) {
  const targetChapter =
    chapterId && chapterId !== 'all'
      ? novel.chapters.find((c) => c.id === chapterId)
      : novel.chapters[0];
  if (targetChapter) {
    exportChapterToTxt(targetChapter, novel);
  }
}

export function exportToMarkdown(novel: Novel, chapterId?: string) {
  const targetChapter =
    chapterId && chapterId !== 'all'
      ? novel.chapters.find((c) => c.id === chapterId)
      : novel.chapters[0];
  if (targetChapter) {
    exportChapterToMarkdown(targetChapter, novel);
  }
}

export function exportToWord(novel: Novel, chapterId?: string) {
  const targetChapter =
    chapterId && chapterId !== 'all'
      ? novel.chapters.find((c) => c.id === chapterId)
      : novel.chapters[0];
  if (targetChapter) {
    exportChapterToWord(targetChapter, novel);
  }
}

export function exportToEpubHtml(novel: Novel, chapterId?: string) {
  const targetChapter =
    chapterId && chapterId !== 'all'
      ? novel.chapters.find((c) => c.id === chapterId)
      : novel.chapters[0];
  if (targetChapter) {
    exportChapterToEpubHtml(targetChapter, novel);
  }
}

export function printNovelBook(
  novel: Novel,
  customStyles = { font: 'amiri', pageSize: 'A4', fontSize: 12 },
  chapterId?: string
) {
  const targetChapter =
    chapterId && chapterId !== 'all'
      ? novel.chapters.find((c) => c.id === chapterId)
      : novel.chapters[0];
  if (targetChapter) {
    exportChapterToPdf(targetChapter, novel, customStyles);
  }
}
