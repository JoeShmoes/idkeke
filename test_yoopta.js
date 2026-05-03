const React = require('react');
const yoopta = require('@yoopta/editor');
const blockquote = require('@yoopta/blockquote');
console.log('Blockquote object keys:', Object.keys(blockquote.default || {}));

const BulletedList = new yoopta.YooptaPlugin({
  type: 'BulletedList',
  elements: { 'bulleted-list': { render: () => null } }
});

const plugins = [
  BulletedList,
  blockquote.default || blockquote
];

console.log('Plugins array:', plugins.map(p => {
  if (!p) return 'UNDEFINED_PLUGIN';
  if (p.plugin) return p.plugin.type + ' (nested plugin elements: ' + !!p.plugin.elements + ')';
  return p.type + ' (elements: ' + !!p.elements + ')';
}));
