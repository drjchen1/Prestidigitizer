const html = `\\\\[ f(x) \\\\]`;
const regex = /\\\[([\s\S]*?)\\\]/g;
console.log(html.replace(regex, '<math>'));
