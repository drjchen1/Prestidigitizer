import temml from 'temml';

const tex = `-\\pi &lt; x &lt; \\pi and the resulting Fourier series is
<math> f(x) \\sim \\frac{1}{2} a_0 + \\sum_{n=1}^{\\infty} (a_n \\cos(nx) + b_n \\sin(nx)) </math> <math> a_n = \\frac{1}{\\pi} \\int_{-\\pi}^{\\pi} f(x) \\cos(nx) \\, dx </math> <math> b_n = \\frac{1}{\\pi} \\int_{-\\pi}^{\\pi} f(x) \\sin(nx) \\, dx </math>
now let's first relax the period \\( 2\\pi`;

try {
  const res = temml.renderToString(tex, { displayMode: false });
  console.log("Success:", res.substring(0, 50));
} catch (e) {
  console.log("Error:", e);
}
