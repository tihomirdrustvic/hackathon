if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('buffer').Buffer;
}
if (typeof global !== 'undefined') {
  global.Buffer = global.Buffer || require('buffer').Buffer;
}
