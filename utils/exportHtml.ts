import { ConversionResult, LayoutMode } from '../types';

export const generateHtmlDocument = (
  results: ConversionResult[],
  originalFileName: string,
  layoutMode: LayoutMode
): string => {
  const firstPageHtml = results[0]?.html || '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(firstPageHtml, 'text/html');
  const firstHeading = doc.querySelector('h1, h2, h3');
  const extractedTitle = firstHeading ? firstHeading.textContent?.trim() : 'Mathematics Course Notes';
  
  const isLandscape = results.length > 0 && results[0].width > results[0].height;
  const containerMaxWidth = isLandscape ? "1200px" : "896px";

  const cleanResults = results.map(r => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(r.html, 'text/html');
    doc.querySelectorAll('.edit-figure-btn').forEach(btn => btn.remove());
    return { ...r, html: doc.body.innerHTML };
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${extractedTitle} - Accessible Math Notes</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        window.MathJax = { 
          tex: { 
            inlineMath: [['\\\\(', '\\\\)']], 
            displayMath: [['\\\\[', '\\\\]']],
            processEscapes: true
          },
          options: { renderActions: { addMenu: [0, '', ''] } }
        };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;600;800&display=swap');
        
        :root {
            --bg: #FDFBF7;
            --ink: #1E293B;
            --heading-color: #0f172a;
            --accent: #CEB888;
            --link-color: #B19B69;
        }

        body { 
            font-family: 'Inter', system-ui, sans-serif; 
            background-color: var(--bg); 
            color: var(--ink); 
            margin: 0; 
            padding: 0; 
            line-height: 1.7;
            font-size: 1.125rem;
        }

        *:focus-visible {
            outline: 3px solid var(--accent);
            outline-offset: 2px;
            border-radius: 2px;
        }

        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--accent);
            color: #000;
            padding: 8px;
            z-index: 100;
            transition: top 0.2s;
            font-family: 'Inter', sans-serif;
            font-weight: bold;
            text-decoration: none;
        }
        .skip-link:focus {
            top: 0;
        }

        .container {
            width: 100%;
            margin: 0 auto;
            padding: 1rem;
            transition: all 0.3s ease;
        }

        @media (min-width: 1024px) {
            .container {
                padding: 2rem;
            }
            .layout {
                display: grid;
                grid-template-columns: 200px 1fr;
                gap: 2rem;
                align-items: start;
                padding-top: 4rem;
                transition: all 0.3s ease;
                max-width: 1600px;
                margin: 0 auto;
            }
            .sidebar-hidden.container {
                padding: 0;
                max-width: none;
            }
            .sidebar-hidden .layout.sidebar-hidden {
                grid-template-columns: 1fr;
                gap: 0;
                max-width: none;
                width: 100%;
                margin: 0;
            }
            .sidebar-hidden article {
                background: transparent !important;
                box-shadow: none !important;
                padding: 2rem 0 !important;
                position: relative;
                width: 100%;
            }
            .sidebar-hidden .download-btn-wrapper {
                position: fixed;
                right: 3rem !important;
                top: 2rem !important;
                z-index: 50;
            }
            .sidebar-hidden .page-badge {
                position: absolute;
                left: 3rem;
                top: 2rem;
                margin: 0;
                z-index: 10;
            }
            .sidebar-hidden .download-btn-wrapper a {
                background: #CEB888;
                color: #000;
                border: 2px solid #000;
                font-weight: 700;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
                transition: transform 0.2s ease;
            }
            .sidebar-hidden .download-btn-wrapper a:hover {
                transform: translateY(-2px);
                background: #e2cf9f;
            }
            .sidebar-hidden .download-btn-wrapper span {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border-width: 0;
            }
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid #f1f5f9;
        }

        .title {
            font-size: 1.875rem;
            font-weight: 800;
            color: var(--heading-color);
            letter-spacing: -0.025em;
            margin: 0;
        }

        .controls {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            text-decoration: none;
        }

        .btn-primary {
            background-color: var(--accent);
            color: #000;
        }

        .btn-primary:hover {
            background-color: #B19B69;
            transform: translateY(-1px);
        }

        .btn-outline {
            background-color: transparent;
            border: 2px solid #e2e8f0;
            color: #64748b;
        }

        .btn-outline:hover {
            border-color: #cbd5e1;
            color: #334155;
        }

        .sidebar {
            position: sticky;
            top: 2rem;
            background: white;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            border: 1px solid #f1f5f9;
            transition: all 0.3s ease;
        }

        .sidebar.hidden {
            transform: translateX(-150%);
            opacity: 0;
            position: absolute;
            pointer-events: none;
        }

        .nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: #64748b;
            text-decoration: none;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 0.875rem;
            transition: all 0.2s;
        }

        .nav-link:hover {
            background-color: #f8fafc;
            color: #0f172a;
        }

        .page-article {
            background: white;
            border-radius: 1.5rem;
            padding: 3rem;
            margin-bottom: 3rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
            border: 1px solid #f1f5f9;
            position: relative;
            transition: all 0.3s ease;
        }

        .page-article.content-expanded {
            padding: 0;
            box-shadow: none;
            border: none;
            background: transparent;
            margin-bottom: 0;
        }

        .sidebar-hidden .math-content {
            max-width: ${containerMaxWidth};
            margin: 0 auto;
            display: block;
            padding: 1.5rem;
            background: #ffffff;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border-radius: 1.5rem;
        }

        @media (min-width: 768px) {
            .sidebar-hidden .math-content {
                padding: 3rem;
            }
        }

        @media (min-width: 1024px) {
            .sidebar-hidden .math-content {
                padding: 5rem;
            }
        }

        .page-badge {
            position: absolute;
            top: -1rem;
            left: 2rem;
            background: var(--accent);
            color: #000;
            padding: 0.25rem 1rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 1023px) {
            .download-btn-wrapper a {
                padding: 0.5rem 1rem;
                font-size: 10px;
            }
            .sidebar-hidden .math-content {
                padding: 1.5rem;
                border-radius: 0;
                grid-template-columns: 1fr;
            }
            .sidebar-hidden .download-btn-wrapper,
            .sidebar-hidden .page-badge {
                position: relative !important;
                left: auto !important;
                right: auto !important;
                top: auto !important;
                margin-bottom: 1rem;
            }
            .sidebar-hidden .download-btn-wrapper {
                display: flex;
                justify-content: flex-end;
            }
        }

        .math-content { 
            color: var(--ink); 
            font-family: 'Crimson Pro', serif;
            font-size: 1.25rem;
            line-height: 1.6;
        }

        .math-content .flex > *,
        .math-content .grid > * {
            min-width: 0;
        }

        .math-content p {
            margin-bottom: 1.5rem;
        }

        .math-content h1 {
            font-family: 'Inter', sans-serif;
            font-size: 2.5rem;
            font-weight: 900;
            color: var(--heading-color);
            margin-top: 0;
            margin-bottom: 2rem;
            letter-spacing: -0.025em;
            line-height: 1.2;
        }

        .math-content h2 {
            font-family: 'Inter', sans-serif;
            font-size: 1.875rem;
            font-weight: 800;
            color: var(--heading-color);
            margin-top: 3rem;
            margin-bottom: 1.5rem;
            letter-spacing: -0.025em;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 0.5rem;
        }

        .math-content h3 {
            font-family: 'Inter', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--heading-color);
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
        }

        .math-content ul, .math-content ol {
            margin-bottom: 1.5rem;
            padding-left: 1.5rem;
        }

        .math-content li {
            margin-bottom: 0.5rem;
        }

        .math-content .notebox {
            border-left: 4px solid var(--accent);
            padding: 1.5rem 2rem;
            margin: 2.5rem 0;
            background-color: #f8fafc;
            border-radius: 0 0.75rem 0.75rem 0;
            font-style: italic;
            color: #334155;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        .math-content figure {
            margin: 3rem 0;
            border-radius: 1rem;
            overflow: hidden;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .math-content figure img {
            max-width: 100%;
            height: auto;
            display: block;
        }

        .math-content figcaption {
            padding: 1rem;
            background: #f8fafc;
            width: 100%;
            text-align: center;
            font-family: 'Inter', sans-serif;
            font-size: 0.875rem;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }

        /* MathJax specific overrides for better contrast and sizing */
        mjx-container {
            font-size: 110% !important;
        }
        
        mjx-container[display="true"] {
            max-width: 100% !important;
            margin: 2rem 0 !important;
            border: none !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
        }

        /* Fix alignment for math in flex containers */
        .math-content .flex mjx-container[display="true"] {
            margin: 0 !important;
            padding: 0 !important;
        }

        /* Safety net: prevent double-boxing if math is nested in a notebox */
        .notebox mjx-container[display="true"] {
            border-left: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 1rem 0 !important;
        }

        @media print {
            body { background: white; }
            .sidebar, .header, .page-badge, .no-print { display: none !important; }
            .layout { display: block; padding: 0; }
            .page-article { 
                box-shadow: none; 
                border: none; 
                padding: 0; 
                margin: 0; 
                page-break-after: always; 
            }
            .math-content { font-size: 12pt; }
        }
    </style>
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div class="container ${layoutMode === 'continuous' ? 'sidebar-hidden' : ''}" id="main-container">
        <header class="header no-print" style="border-bottom: none; margin-bottom: 1rem; padding-bottom: 0;">
            <div class="controls" style="width: 100%; justify-content: flex-end;">
                ${layoutMode === 'paginated' ? `
                <button id="sidebar-toggle" class="btn btn-outline" aria-expanded="true" aria-controls="sidebar-nav">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    Toggle Sidebar
                </button>
                ` : ''}
                <button onclick="window.print()" class="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Print PDF
                </button>
            </div>
        </header>

        <div class="layout ${layoutMode === 'continuous' ? 'sidebar-hidden' : ''}" id="main-layout">
            ${layoutMode === 'paginated' ? `
            <nav class="sidebar no-print" id="sidebar-nav" aria-label="Page navigation">
                <h2 style="font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-top: 0; margin-bottom: 1rem;">Contents</h2>
                <ul class="nav-list">
                    ${cleanResults.map(r => `
                    <li>
                        <a href="#page-${r.pageNumber}" class="nav-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            Page ${r.pageNumber}
                        </a>
                    </li>
                    `).join('')}
                </ul>
            </nav>
            ` : ''}
            <main id="main-content" class="content" style="padding-bottom: 12rem;">
                ${layoutMode === 'continuous' ? `
                <article role="region" class="page-article content-expanded">
                    <div class="math-content">
                        ${cleanResults.map((r, i) => `
                        ${i > 0 ? `
                        <div style="display: flex; align-items: center; justify-content: center; margin: 4rem 0; position: relative;">
                            <div style="position: absolute; inset: 0; display: flex; align-items: center;" aria-hidden="true">
                                <div style="width: 100%; border-top: 1px dashed #cbd5e1;"></div>
                            </div>
                            <div style="position: relative; display: flex; justify-content: center;">
                                <span style="background: #ffffff; padding: 0 1rem; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Page ${r.pageNumber}</span>
                            </div>
                        </div>
                        ` : ''}
                        <span class="sr-only">Original Page ${r.pageNumber}</span>
                        ${r.html}
                        `).join('\n')}
                    </div>
                </article>
                ` : cleanResults.map((r, idx) => `
                <article id="page-${r.pageNumber}" role="region" class="page-article">
                    ${idx === 0 && originalFileName ? `
                    <div class="no-print download-btn-wrapper" style="position: absolute; top: 0; right: 1.5rem;">
                        <a href="${originalFileName}" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CFB991] text-black rounded-xl font-black text-[11px] hover:bg-[#B19B69] transition-all border-2 border-black no-underline tracking-widest shadow-xl transform hover:-translate-y-0.5 active:translate-y-0" title="Download original notes">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 21v-8H7v8" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 3v5h8" />
                            </svg>
                            <span>Download original notes</span>
                        </a>
                    </div>` : ''}
                    <span class="page-badge">PAGE ${r.pageNumber}</span>
                    <div class="math-content">
                        ${r.html}
                    </div>
                </article>`).join('\n')}
            </main>
        </div>
    </div>
    <script>
        const toggleBtn = document.getElementById('sidebar-toggle');
        const container = document.querySelector('.container');
        const layout = document.getElementById('main-layout');
        const sidebar = document.getElementById('sidebar-nav');
        const articles = document.querySelectorAll('.page-article');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = sidebar.classList.toggle('hidden');
                layout.classList.toggle('sidebar-hidden');
                container.classList.toggle('sidebar-hidden');
                toggleBtn.setAttribute('aria-expanded', !isHidden);
                
                articles.forEach(article => {
                    if (isHidden) {
                        article.classList.add('content-expanded');
                    } else {
                        article.classList.remove('content-expanded');
                    }
                });
            });
        }

        function checkMobile() {
            if (toggleBtn) {
                if (window.innerWidth < 1024) {
                    toggleBtn.style.display = 'none';
                } else {
                    toggleBtn.style.display = 'flex';
                }
            }
        }
        window.addEventListener('resize', checkMobile);
        checkMobile();
    </script>
</body>
</html>`;
};
