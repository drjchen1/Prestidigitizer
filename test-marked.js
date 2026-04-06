import { marked } from 'marked';

const markdown = `we've been assuming \\( f(x) \\) has period \\( 2\\pi \\) and defined on \\( -\\pi < x < \\pi \\) and the resulting Fourier series is
\\[ f(x) \\sim \\frac{1}{2} a_0 + \\sum_{n=1}^{\\infty} (a_n \\cos(nx) + b_n \\sin(nx)) \\]`;

console.log(marked.parse(markdown));
