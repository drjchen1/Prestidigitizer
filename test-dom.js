import { JSDOM } from 'jsdom';
const dom = new JSDOM(`<body>\\[ f(x) \\]</body>`);
const html = dom.window.document.body.innerHTML;
const regex = /\\\[([\s\S]*?)\\\]/g;
console.log(html.match(regex));
