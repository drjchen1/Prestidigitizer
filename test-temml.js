import temml from 'temml';

const tex = `f(x) \\sim \\frac{1}{2} a_0 + \\sum_{n=1}^{\\infty} (a_n \\cos(nx) + b_n \\sin(nx))`;

try {
  console.log(temml.renderToString(tex, { displayMode: true }));
} catch (e) {
  console.error(e);
}
