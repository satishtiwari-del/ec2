````md
# Do’s and Don’ts

## General Types

### `Number`, `String`, `Boolean`, `Symbol` and `Object`

❌ **Don’t** ever use the types `Number`, `String`, `Boolean`, `Symbol`, or `Object`. These types refer to non-primitive boxed objects that are almost never used appropriately in JavaScript code. :contentReference[oaicite:1]{index=1}

```ts
/* WRONG */
function reverse(s: String): String;
````

✅ **Do** use the primitive types `number`, `string`, `boolean`, and `symbol`.

```ts
/* OK */
function reverse(s: string): string;
```

Instead of `Object`, use the non-primitive `object` type (added in TypeScript 2.2).

### Generics

❌ **Don’t** define a generic type that doesn’t use its type parameter. See more details in the TypeScript FAQ. ([TypeScript][1])

### `any`

❌ **Don’t** use `any` unless you're migrating a JS project to TypeScript. It effectively disables type checking: ([TypeScript][1])

✅ Use `unknown` when you want to accept anything you’ll pass through without interacting with it.

---

## Callback Types

### Return Types of Callbacks

❌ **Don’t** annotate callbacks that ignore return values as `any`:

```ts
/* WRONG */
function fn(x: () => any) {
  x();
}
```

✅ **Do** use `void` when the return value is ignored:

```ts
/* OK */
function fn(x: () => void) {
  x();
}
```

This prevents accidental misuse of the return value. ([TypeScript][1])

### Optional Parameters in Callbacks

❌ **Don’t** make callback parameters optional unless that’s intentional:

```ts
/* WRONG */
interface Fetcher {
  getObject(done: (data: unknown, elapsedTime?: number) => void): void;
}
```

✅ **Do** write them as non-optional:

```ts
/* OK */
interface Fetcher {
  getObject(done: (data: unknown, elapsedTime: number) => void): void;
}
```

Optionality suggests the argument might not be supplied, which is usually not intended. ([TypeScript][1])

### Overloads and Callbacks

❌ **Don’t** write separate overloads that differ only by callback arity:

```ts
/* WRONG */
declare function beforeAll(action: () => void, timeout?: number): void;
declare function beforeAll(action: (done: DoneFn) => void, timeout?: number): void;
```

✅ **Do** use one overload with the maximum arity:

````ts
/* OK */
declare function beforeAll(action: (done: DoneFn) => void, timeout?: number): void;
``` :contentReference[oaicite:19]{index=19}

---

## Function Overloads

### Ordering

❌ **Don’t** put general overloads before specific ones:

```ts
/* WRONG */
declare function fn(x: unknown): unknown;
declare function fn(x: HTMLElement): number;
declare function fn(x: HTMLDivElement): string;
````

This leads to incorrect resolution:

```ts
var myElem: HTMLDivElement;
var x = fn(myElem); // x: unknown, wrong!
```

✅ **Do** order from more specific to more general:

```ts
/* OK */
declare function fn(x: HTMLDivElement): string;
declare function fn(x: HTMLElement): number;
declare function fn(x: unknown): unknown;
```

````ts
var x = fn(myElem); // x: string
``` :contentReference[oaicite:22]{index=22}

### Use Optional Parameters

❌ **Don’t** write multiple overloads differing only by trailing parameters:

```ts
/* WRONG */
interface Example {
  diff(one: string): number;
  diff(one: string, two: string): number;
  diff(one: string, two: string, three: boolean): number;
}
````

✅ **Do** use optional parameters instead:

```ts
/* OK */
interface Example {
  diff(one: string, two?: string, three?: boolean): number;
}
```

This simplifies usage and avoids subtle overload-compatibility issues. ([TypeScript][1])

### Use Union Types

❌ **Don’t** separate overloads differing in only one argument type:

```ts
/* WRONG */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number): Moment;
  utcOffset(b: string): Moment;
}
```

✅ **Do** use union types:

````ts
/* OK */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number | string): Moment;
}
``` :contentReference[oaicite:28]{index=28}

---

### On this page

- General Types  
  - Number, String, Boolean, Symbol and Object  
  - Generics  
  - any  
- Callback Types  
  - Return Types of Callbacks  
  - Optional Parameters in Callbacks  
  - Overloads and Callbacks  
- Function Overloads  
  - Ordering  
  - Use Optional Parameters  
  - Use Union Types  

_Last updated: July 07, 2025_ :contentReference[oaicite:29]{index=29}
````

[1]: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html?utm_source=chatgpt.com "Documentation - Do's and Don'ts - TypeScript"
