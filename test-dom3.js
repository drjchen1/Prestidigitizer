import { JSDOM } from 'jsdom';
const dom = new JSDOM(`<body>\\[ f(x) \\]</body>`);
console.log(dom.window.document.body.innerHTML);
