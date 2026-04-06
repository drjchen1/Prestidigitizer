const html = `\\\\[ f(x) \\\\\\]`;
const regex = /\\\[([\s\S]*?)\\\]/g;
console.log(html.match(regex));
