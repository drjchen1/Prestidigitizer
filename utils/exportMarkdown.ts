import TurndownService from 'turndown';
import { ConversionResult } from '../types';

export const generateMarkdownDocument = (
  results: ConversionResult[],
  originalFileName: string
): string => {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  });

  // Disable escaping to prevent Turndown from adding backslashes to LaTeX math
  // e.g., preventing \( x^2 \) from becoming \\( x\^2 \\)
  turndownService.escape = function (string) {
    return string;
  };

  // Custom rule for figures to ensure they format nicely in Markdown
  turndownService.addRule('figure', {
    filter: 'figure',
    replacement: function (content, node) {
      const element = node as HTMLElement;
      const img = element.querySelector('img');
      const figcaption = element.querySelector('figcaption');
      const alt = img ? img.getAttribute('alt') || 'Figure' : 'Figure';
      const src = img ? img.getAttribute('src') || '' : '';
      const caption = figcaption ? figcaption.textContent?.trim() : '';
      
      return `\n\n![${alt}](${src})\n*${caption}*\n\n`;
    }
  });

  const baseFileName = originalFileName ? originalFileName.replace(/\.[^/.]+$/, "") : "Math Notes";
  let markdown = `# ${baseFileName}\n\n`;

  results.forEach((r, index) => {
    if (index > 0) {
      markdown += `\n\n---\n\n## Page ${r.pageNumber}\n\n`;
    } else {
      markdown += `## Page ${r.pageNumber}\n\n`;
    }

    // Clean up HTML before converting
    const parser = new DOMParser();
    const doc = parser.parseFromString(r.html, 'text/html');
    
    // Remove UI elements that shouldn't be in the export
    doc.querySelectorAll('.edit-figure-btn').forEach(btn => btn.remove());
    
    markdown += turndownService.turndown(doc.body.innerHTML);
  });

  return markdown;
};
