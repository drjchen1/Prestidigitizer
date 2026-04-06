import JSZip from 'jszip';
import temml from 'temml';
import { ConversionResult } from '../types';

export const generateEpubDocument = async (
  results: ConversionResult[],
  originalFileName: string
): Promise<Blob> => {
  const zip = new JSZip();
  const baseFileName = originalFileName ? originalFileName.replace(/\.[^/.]+$/, "") : "Math Notes";

  // 1. mimetype (must be uncompressed, but JSZip handles this well enough for most readers)
  zip.file("mimetype", "application/epub+zip");

  // 2. META-INF/container.xml
  const metaInf = zip.folder("META-INF");
  metaInf?.file("container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  const oebps = zip.folder("OEBPS");
  const imagesFolder = oebps?.folder("images");

  // 3. Process HTML and extract images
  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const navPoints: string[] = [];
  let imageCounter = 0;

  const processHtmlForEpub = (html: string, pageNum: number) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove UI elements
    doc.querySelectorAll('.edit-figure-btn').forEach(btn => btn.remove());

    // Process images
    doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('data:image/')) {
        const matches = src.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const data = matches[2];
          const imageName = `image_${imageCounter}.${ext}`;
          
          imagesFolder?.file(imageName, data, { base64: true });
          
          manifestItems.push(`<item id="img_${imageCounter}" href="images/${imageName}" media-type="image/${ext === 'jpg' ? 'jpeg' : ext}"/>`);
          
          img.setAttribute('src', `images/${imageName}`);
          imageCounter++;
        }
      }
    });

    // Helper to decode HTML entities
    const decodeHtmlEntities = (text: string) => {
      const textArea = document.createElement('textarea');
      textArea.innerHTML = text;
      return textArea.value;
    };

    // Ensure it's valid XHTML
    let htmlContent = doc.body.innerHTML;

    // Replace display math \[ ... \]
    htmlContent = htmlContent.replace(/\\\[([\s\S]*?)\\\]/g, (match, tex) => {
      try {
        const decodedTex = decodeHtmlEntities(tex);
        const mathml = temml.renderToString(decodedTex, { displayMode: true });
        return mathml.replace(/<math\b/, '<math xmlns="http://www.w3.org/1998/Math/MathML"');
      } catch (e) {
        console.warn('Temml error:', e);
        return `<span style="color: red;">ParseError: ${e instanceof Error ? e.message : String(e)}</span><br/>${match}`;
      }
    });

    // Replace inline math \( ... \)
    htmlContent = htmlContent.replace(/\\\(([\s\S]*?)\\\)/g, (match, tex) => {
      try {
        const decodedTex = decodeHtmlEntities(tex);
        const mathml = temml.renderToString(decodedTex, { displayMode: false });
        return mathml.replace(/<math\b/, '<math xmlns="http://www.w3.org/1998/Math/MathML"');
      } catch (e) {
        console.warn('Temml error:', e);
        return `<span style="color: red;">ParseError: ${e instanceof Error ? e.message : String(e)}</span> ${match}`;
      }
    });

    const tempDoc = parser.parseFromString(htmlContent, 'text/html');
    const xhtml = new XMLSerializer().serializeToString(tempDoc.body);
    
    // Wrap in proper XHTML structure
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:m="http://www.w3.org/1998/Math/MathML" lang="en">
<head>
  <title>Page ${pageNum}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
${xhtml}
</body>
</html>`;
  };

  results.forEach((r) => {
    const pageId = `page_${r.pageNumber}`;
    const fileName = `${pageId}.xhtml`;
    const xhtmlContent = processHtmlForEpub(r.html, r.pageNumber);
    
    oebps?.file(fileName, xhtmlContent);
    
    manifestItems.push(`<item id="${pageId}" href="${fileName}" media-type="application/xhtml+xml" properties="mathml"/>`);
    spineItems.push(`<itemref idref="${pageId}"/>`);
    navPoints.push(`
      <navPoint id="navPoint-${r.pageNumber}" playOrder="${r.pageNumber}">
        <navLabel><text>Page ${r.pageNumber}</text></navLabel>
        <content src="${fileName}"/>
      </navPoint>
    `);
  });

  // 4. Add styles
  oebps?.file("styles.css", `
    body { font-family: sans-serif; line-height: 1.6; padding: 1em; }
    img { max-width: 100%; height: auto; }
    figure { margin: 1em 0; text-align: center; }
    figcaption { font-size: 0.9em; font-style: italic; color: #555; }
    .notebox { border-left: 4px solid #CEB888; padding: 1em; background: #f8fafc; margin: 1em 0; }
  `);
  manifestItems.push(`<item id="css" href="styles.css" media-type="text/css"/>`);

  // 5. content.opf
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '12345-67890';
  const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${baseFileName}</dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="pub-id">urn:uuid:${uuid}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
  oebps?.file("content.opf", opfContent);

  // 6. toc.ncx
  const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${baseFileName}</text></docTitle>
  <navMap>
    ${navPoints.join('\n    ')}
  </navMap>
</ncx>`;
  oebps?.file("toc.ncx", ncxContent);

  return await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
};
