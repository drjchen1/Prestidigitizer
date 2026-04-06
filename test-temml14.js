import temml from 'temml';

const tex = `\\<math> f(x) \\</math>`;

console.log(temml.renderToString(tex, { displayMode: false }));
