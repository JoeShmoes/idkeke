---
name: "yoopta-editor-integration"
description: "Troubleshoots and implements YooptaEditor v4+ in Next.js. Invoke when encountering 'Cannot read properties of undefined (reading elements)', plugin import issues, SSR errors, or clipboard security problems."
---

# YooptaEditor Integration Skill

This skill provides comprehensive troubleshooting and implementation guidance for YooptaEditor v4+ in Next.js applications, based on extensive real-world debugging experience.

## When to Use This Skill

Invoke this skill when you encounter:
- "Cannot read properties of undefined (reading 'elements')" runtime errors
- Plugin import resolution issues
- SSR (Server-Side Rendering) compatibility problems
- Clipboard security errors ("NotAllowedError: Failed to execute 'writeText' on 'Clipboard'")
- Editor state corruption or initialization issues
- Custom plugin development and validation

## Core Principles

### 1. Plugin Structure Validation
YooptaEditor v4+ requires strict plugin structure:
```typescript
// Valid plugin structure
const ValidPlugin = {
  type: 'PluginType',
  elements: {
    'element-key': {
      render: ElementComponent,
      props: { nodeType: 'void' | 'block' },
    }
  },
  options: {
    display: {
      title: 'Plugin Name',
      description: 'Plugin description',
      icon: <IconComponent />,
    },
    shortcuts: ['@'],
  }
};
```

### 2. Import Resolution
Yoopta v4+ plugins must be imported correctly:
```typescript
// Correct imports
import { Paragraph } from '@yoopta/paragraph';
import { HeadingOne, HeadingTwo, HeadingThree } from '@yoopta/headings';
import { BulletedList, NumberedList } from '@yoopta/lists';

// Avoid deep imports that may break
// ❌ import HeadingOne from '@yoopta/headings/dist/plugins/heading-one';
```

### 3. SSR Safety
Use dynamic imports for YooptaEditor in Next.js:
```typescript
const YooptaEditor = dynamic(
  () => import('@yoopta/editor').then(mod => mod.YooptaEditor),
  { ssr: false, loading: () => <div>Loading editor...</div> }
);
```

## Common Error Patterns and Solutions

### Error: "Cannot read properties of undefined (reading 'elements')"
**Root Cause**: Plugin structure violation or undefined plugin import
**Solution**:
```typescript
// Add plugin validation
const safePlugins = useMemo(() => {
  if (!Array.isArray(plugins)) return [];
  
  return plugins.filter(p => {
    if (!p || typeof p !== 'object') return false;
    
    // Check for elements directly or nested in plugin property
    const hasElements = (p as any).elements || (p as any).plugin?.elements;
    return !!hasElements;
  });
}, [plugins]);
```

### Error: "NotAllowedError: Failed to execute 'writeText' on 'Clipboard'"
**Root Cause**: Clipboard API called without user interaction or focus
**Solution**:
```typescript
export async function copyToClipboard(text: string) {
  try {
    if (!document.hasFocus()) return;
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Clipboard blocked:", err);
  }
}
```

### Error: Editor state corruption
**Root Cause**: Multiple editor instances or improper memoization
**Solution**: Use singleton pattern with useRef
```typescript
const editorRef = useRef<any>(null);

if (!editorRef.current) {
  editorRef.current = createYooptaEditor();
}

const editor = editorRef.current;
```

## Debugging Methodology

### 1. Nuclear Isolation Test
```typescript
// Temporarily reduce to one plugin
const plugins = useMemo(() => {
  console.log("RAW PLUGINS:", [Paragraph]);
  return [Paragraph]; // ONLY ONE PLUGIN
}, []);
```

### 2. Plugin Integrity Validation
```typescript
useEffect(() => {
  safePlugins.forEach((p, i) => {
    console.log(`PLUGIN ${i}:`, p);
    console.log(`ELEMENTS ${i}:`, p?.elements);
    
    if (!p?.elements) {
      console.error("💥 Broken plugin at index", i, p);
    }
    if (!p?.type) {
      console.error("💥 Plugin missing type", p);
    }
  });
}, [safePlugins]);
```

### 3. Import Verification
```typescript
// Add debug logging
console.log("Paragraph:", Paragraph);
console.log("HeadingOne:", HeadingOne);
console.log("HeadingTwo:", HeadingTwo);
console.log("HeadingThree:", HeadingThree);
```

## Custom Plugin Development

### NoteLinkPlugin Example
```typescript
const NoteLinkPlugin = {
  type: 'NoteLink',
  elements: {
    'note-link': {
      render: NoteLinkRender,
      props: {
        nodeType: 'void',
      },
    }
  },
  options: {
    display: {
      title: 'Link to Page',
      description: 'Embed a link to another document',
      icon: <FileText className="w-5 h-5" />,
    },
    shortcuts: ['@'],
  },
};

export default NoteLinkPlugin;
```

## Data Persistence Pattern

### Local Storage + Supabase Sync
```typescript
const saveNote = useCallback(async (content: any) => {
  // Save to local storage immediately
  localStorage.setItem(`note-${activeNote.id}`, JSON.stringify(content));
  
  // Debounced sync to Supabase
  if (supabaseSyncTimeout.current) {
    clearTimeout(supabaseSyncTimeout.current);
  }
  
  supabaseSyncTimeout.current = setTimeout(async () => {
    try {
      await supabase
        .from('notes')
        .update({ content: JSON.stringify(content) })
        .eq('id', activeNote.id);
    } catch (error) {
      console.error('Supabase sync failed:', error);
    }
  }, 1000);
}, [activeNote?.id]);
```

## Best Practices

1. **Always validate plugin structure** before passing to YooptaEditor
2. **Use dynamic imports** for SSR compatibility
3. **Implement proper error boundaries** around YooptaEditor
4. **Use singleton pattern** for editor instance management
5. **Add comprehensive logging** for debugging plugin issues
6. **Test plugin imports** in isolation before combining
7. **Follow Yoopta v4+ documentation** for plugin structure

## Common Pitfalls

- ❌ Mixing Yoopta v3 and v4 plugin structures
- ❌ Using deep imports that may break in different build systems
- ❌ Forgetting SSR considerations in Next.js
- ❌ Not handling clipboard security restrictions
- ❌ Creating multiple editor instances causing state corruption

This skill encapsulates the hard-earned knowledge from extensive YooptaEditor troubleshooting and provides a systematic approach to resolving common integration issues.