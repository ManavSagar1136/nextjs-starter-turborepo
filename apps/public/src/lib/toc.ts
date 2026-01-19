export interface TOCItem {
  level: number;
  text: string;
  id: string;
}

export function generateTOCFromHTML(htmlContent: string): TOCItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

  return Array.from(headings).map((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent || "";
    const id = heading.id || text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return { level, text, id };
  });
}

export function generateTOCFromText(textContent: string): TOCItem[] {
  const lines = textContent.split("\n");
  const toc: TOCItem[] = [];

  lines.forEach((line) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      toc.push({ level, text, id });
    }
  });

  return toc;
}
