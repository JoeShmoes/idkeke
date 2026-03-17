
const ImagePkg = require('@yoopta/image');
const TablePkg = require('@yoopta/table');
const LinkPkg = require('@yoopta/link');

console.log('Image:', ImagePkg);
console.log('Table:', TablePkg);
console.log('Link:', LinkPkg);

try {
  const extendedImage = ImagePkg.default.extend({ options: {} });
  console.log('Extended Image:', extendedImage);
} catch (e) {
  console.error('Error extending image:', e);
}
