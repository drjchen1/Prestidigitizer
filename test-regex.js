const html = `\\[ f(x) \\sim \\frac{1}{2} a_0 + \\sum_{n=1}^{\\infty} (a_n \\cos(nx) + b_n \\sin(nx)) \\]`;
const regex = /\\\[([\s\S]*?)\\\]/g;
console.log(html.match(regex));
