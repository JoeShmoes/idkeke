
import { YooptaPlugin } from '@yoopta/editor';

const myPlugin = new YooptaPlugin({
    type: 'Test',
    elements: { foo: { render: () => null } }
});

console.log('MyPlugin:', myPlugin);
console.log('MyPlugin Keys:', Object.keys(myPlugin));
