import { JSDOM } from 'jsdom';
const dom = new JSDOM(`<body>&#92;[ f(x) &#92;]</body>`);
console.log(dom.window.document.body.innerHTML);
