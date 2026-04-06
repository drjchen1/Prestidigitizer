const html = `
        <script>
          window.MathJax = {
            tex: { 
              inlineMath: [['\\\\(', '\\\\)']], 
              displayMath: [['\\\\[', '\\\\]']],
              processEscapes: true
            },
`;
console.log(html);
