const html = `\\\\[ f(x) \\\\]`;
const regex = /\\\[([\s\S]*?)\\\]/g;
console.log(html.replace(regex, (match, tex) => {
  return `<math>${tex}</math>`;
}));
