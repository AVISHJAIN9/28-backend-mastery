# 13.13: Function Overloads - Multiple Signatures

## What are Function Overloads?

**Function overloads** let you define multiple signatures for a single function.

```typescript
function add(a: number, b: number): number;
function add(a: string, b: string): string;
function add(a: any, b: any): any {
  return a + b;
}

add(1, 2);        // OK: returns number
add('a', 'b');    // OK: returns string
// add(1, 'b');   // ERROR: no matching overload
```

---

## Patterns

### Type-based Overloads

```typescript
function process(value: string): string[];
function process(value: number): number;
function process(value: any): any {
  if (typeof value === 'string') {
    return value.split('');
  }
  return value * 2;
}
```

### Optional Parameter Overloads

```typescript
function createElement(tag: string): HTMLElement;
function createElement(tag: string, content: string): HTMLElement;
function createElement(tag: string, content?: string): HTMLElement {
  const el = document.createElement(tag);
  if (content) el.textContent = content;
  return el;
}
```

### Generic Overloads

```typescript
function identity<T>(value: T): T;
function identity<T, U>(value: T, transform: (v: T) => U): U;
function identity<T>(value: T, transform?: (v: T) => any): any {
  return transform ? transform(value) : value;
}
```
