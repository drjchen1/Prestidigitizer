const html = `\\[ f(x) \\sim \\frac{1}{2} a_0 + \\sum_{n=1}^{\\infty} (a_n \\cos(nx) + b_n \\sin(nx)) \\] \\[ a_n = \\frac{1}{\\pi} \\int_{-\\pi}^{\\pi} f(x) \\cos(nx) \\, dx \\] \\[ b_n = \\frac{1}{\\pi} \\int_{-\\pi}^{\\pi} f(x) \\sin(nx) \\, dx \\]`;
const regex = /\\\[([\s\S]*?)\\\]/g;
console.log(html.match(regex));
