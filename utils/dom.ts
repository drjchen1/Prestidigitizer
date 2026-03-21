
/**
 * Escapes special characters for use in HTML attributes.
 */
export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Cleans alt text for accessibility by removing LaTeX delimiters
 * and escaping HTML characters.
 */
export const cleanAltText = (alt: string): string => {
  if (!alt) return "";
  const noLatexDelimiters = alt.replace(/\\\(|\\\)|\\\[|\\\]/g, '');
  return escapeHtml(noLatexDelimiters);
};
