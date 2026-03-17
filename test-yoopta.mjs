
import Paragraph from '@yoopta/paragraph';

console.log('Default Export:', Paragraph);
if (Paragraph) {
    console.log('Keys:', Object.keys(Paragraph));
    console.log('Has elements?', !!Paragraph.elements);
}
