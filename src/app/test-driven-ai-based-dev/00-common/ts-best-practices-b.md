
# TypeScript Best Practices for Large Angular Projects

> A comprehensive guide to writing scalable, maintainable TypeScript in enterprise-grade Angular applications.

---

## 🧱 Project Structure

### ✅ **Feature-based Modular Architecture**
If not specifically requested, always follow **ng-ts-proj-structure-guidelines.md** to architect code and documents.

### ✅ **Use Barrels (`index.ts`)**
- Export shared module elements via `index.ts` files:
  ```ts
  // user/index.ts
  export * from './user.service';
  export * from './user.model';
  ```

---

## ⚙️ Compiler and Angular Configuration

### ✅ **Enable Strict Mode**
In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true
  }
}
```

### ✅ **Use Path Aliases**
In `tsconfig.base.json`:
```json
"paths": {
  "@app/*": ["src/app/*"],
  "@shared/*": ["src/app/shared/*"]
}
```

---

## 🧠 Types and Interfaces

### ✅ **Use `interface` for data models**
```ts
export interface User {
  id: string;
  name: string;
  roles: string[];
}
```

### ✅ **Use `type` for unions/enums**
```ts
export type UserRole = 'admin' | 'user' | 'guest';
```

### ❌ **Avoid `any`**
Use `unknown` for untrusted external data:
```ts
function parseResponse(data: unknown): MyType {
  if (typeof data === 'object' && data !== null) {
    // type assertions...
  }
}
```

---

## 📦 Dependency Injection and Services

### ✅ **Strongly Type Injectable Services**
```ts
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }
}
```

### ✅ **Use InjectionTokens for configuration**
```ts
export const API_URL = new InjectionToken<string>('API_URL');
```

---

## 💡 Angular-Specific Patterns

### ✅ **Use `as const` for config values**
```ts
export const NAV_TABS = [
  { label: 'Home', route: '/home' },
  { label: 'Profile', route: '/profile' },
] as const;
```

### ✅ **Strongly type `@Input()` and `@Output()`**
```ts
@Input() user!: User;
@Output() deleted = new EventEmitter<string>();
```

---

## 📚 Forms

### ✅ **Type reactive form groups**
```ts
form = this.fb.group({
  name: ['', Validators.required],
  age: [null as number | null],
});
```

### ✅ **Use model-based interfaces**
```ts
interface UserFormValue {
  name: string;
  age: number | null;
}
```

---

## 🧪 Testing

### ✅ **Use strongly typed test data**
```ts
const mockUser: User = {
  id: '123',
  name: 'Alice',
  roles: ['user'],
};
```

### ✅ **Use `TestBed` with explicit types**
```ts
const fixture = TestBed.createComponent(MyComponent);
const component = fixture.componentInstance as MyComponent;
```

---

## 🧼 Code Quality

### ✅ **Use ESLint with `@typescript-eslint` and Angular Plugin**
Recommended rules:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/consistent-type-imports`
- `@angular-eslint/no-host-metadata-property`
- `@angular-eslint/use-lifecycle-interface`

### ✅ **Use Prettier for formatting**
Ensure `.prettierrc` matches team conventions.

---


## 🧠 Advanced Tips

### ✅ **Use `Readonly` types for immutable props**
```ts
interface Config {
  readonly apiBaseUrl: string;
}
```

### ✅ **Use discriminated unions for UI state**
```ts
type State =
  | { kind: 'loading' }
  | { kind: 'error'; error: string }
  | { kind: 'loaded'; data: User[] };
```

---

## 🔐 Security

### ✅ **Validate external input**
Always validate or sanitize external data before using in templates or HTTP requests.

---

## 🏁 Conclusion

Maintaining type safety, modular design, and strict conventions ensures a scalable Angular codebase. TypeScript’s rich type system enables early bug detection and better documentation—lean into it fully.

---

_Last updated: July 12, 2025_
