# 13.12: Recursive Types - Self-Referencing Structures

## What are Recursive Types?

**Recursive types** reference themselves to express nested or tree-like structures.

### File System Tree

```typescript
interface FileNode {
  name: string;
  children?: FileNode[];  // Self-reference
}

const tree: FileNode = {
  name: 'root',
  children: [
    { name: 'file1.txt' },
    {
      name: 'folder',
      children: [
        { name: 'file2.txt' },
        { name: 'file3.txt' }
      ]
    }
  ]
};
```

### JSON Type

```typescript
type JSON = 
  | string
  | number
  | boolean
  | null
  | JSON[]
  | { [key: string]: JSON };

const data: JSON = {
  name: 'John',
  age: 30,
  address: {
    street: '123 Main',
    city: 'NYC'
  }
};
```

### Linked List

```typescript
interface LinkedListNode<T> {
  value: T;
  next?: LinkedListNode<T>;
}

const list: LinkedListNode<number> = {
  value: 1,
  next: {
    value: 2,
    next: {
      value: 3
    }
  }
};
```

### DOM Tree

```typescript
interface DOMNode {
  name: string;
  attrs?: Record<string, string>;
  children?: DOMNode[];
}

const dom: DOMNode = {
  name: 'div',
  attrs: { class: 'container' },
  children: [
    { name: 'h1', children: [{ name: 'text', attrs: { value: 'Title' } }] },
    { name: 'p', children: [{ name: 'text', attrs: { value: 'Content' } }] }
  ]
};
```

---

## Utilities for Recursive Types

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

type Flatten<T> = T extends Array<infer U> ? Flatten<U> : T;

type DeepPartial<T> = {
  [K in keyof T]?: DeepPartial<T[K]>;
};
```
