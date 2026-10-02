# TypeScript Type System — Hướng Dẫn Toàn Diện

> Tài liệu này dành cho người mới bắt đầu với TypeScript. Mỗi phần đều có giải thích, ví dụ, và lưu ý thực tế khi code.

---

## Mục lục

1. [TypeScript là gì?](#1-typescript-là-gì)
2. [Primitive Types — Kiểu dữ liệu cơ bản](#2-primitive-types--kiểu-dữ-liệu-cơ-bản)
3. [Special Types — Kiểu đặc biệt](#3-special-types--kiểu-đặc-biệt)
4. [Object & Structural Types — Kiểu đối tượng](#4-object--structural-types--kiểu-đối-tượng)
5. [Advanced Types — Kiểu nâng cao](#5-advanced-types--kiểu-nâng-cao)
6. [Type Narrowing — Thu hẹp kiểu](#6-type-narrowing--thu-hẹp-kiểu)
7. [Type Assertions — Ép kiểu](#7-type-assertions--ép-kiểu)
8. [Utility Types — Kiểu tiện ích](#8-utility-types--kiểu-tiện-ích)
9. [Common Mistakes — Lỗi thường gặp](#9-common-mistakes--lỗi-thường-gặp)
10. [Tips & Best Practices](#10-tips--best-practices)

---

## 1. TypeScript là gì?

TypeScript là JavaScript có thêm **kiểu dữ liệu** (type). Nó giúp:

- Phát hiện lỗi sớm (lúc viết code, không phải lúc chạy)
- Code tự động gợi ý thuộc tính, phương thức đúng
- Đọc code dễ hơn vì biết rõ dữ liệu là gì

### Ví dụ đơn giản

```typescript
// JavaScript — không biết age là gì, có thể là string, object, undefined...
const age = "25";
console.log(age + 5); // "255" (sai! muốn tính số nhưng thành nối chuỗi)

// TypeScript — khai báo rõ ràng
const age: number = 25;
console.log(age + 5); // 30 (đúng!)
```

---

## 2. Primitive Types — Kiểu dữ liệu cơ bản

Primitive types là các giá trị đơn giản, không thể chia nhỏ hơn.

### 2.1 `string` — Văn bản

```typescript
const name: string = "Lan";
const greeting: string = `Xin chào, ${name}`; // Template literal
```

### 2.2 `number` — Số

```typescript
const age: number = 25;
const price: number = 99.99;
const hex: number = 0xff;      // 255
const binary: number = 0b1010;  // 10
```

### 2.3 `boolean` — Đúng/Sai

```typescript
const isActive: boolean = true;
const hasPermission: boolean = false;
```

### 2.4 `null` và `undefined`

```typescript
let result: null = null;       // Có giá trị "rỗng" — người lập trình chủ động gán
let pending: undefined = undefined; // Chưa được gán giá trị
```

| Khác biệt | `null` | `undefined` |
|-----------|--------|-------------|
| Ý nghĩa | Giá trị rỗng có chủ đích | Biến chưa được gán |
| Dùng khi | Biết rằng "không có gì" | Chưa biết giá trị |

### 2.5 `bigint` — Số cực lớn

```typescript
const huge: bigint = 9007199254740991n;
const calculated: bigint = huge + 10n;
```

### 2.6 `symbol` — Định danh duy nhất

```typescript
const id1: symbol = Symbol("id");
const id2: symbol = Symbol("id");
console.log(id1 === id2); // false — mỗi symbol là duy nhất
```

---

## 3. Special Types — Kiểu đặc biệt

### 3.1 `any` — Tắt kiểm tra kiểu

```typescript
let data: any = "hello";
data = 123;       // Được
data.foo();       // Được — TypeScript không cảnh báo (NGUY HIỂM!)
```

> ⚠️ **Cảnh báo:** `any` tắt toàn bộ kiểm tra. Tránh dùng nếu có thể. Nếu bắt buộc, càng hạn chế càng tốt.

### 3.2 `unknown` — Kiểu an toàn thay thế `any`

```typescript
let data: unknown = getDataFromAPI(); // Không biết kiểu gì

// Phải kiểm tra trước khi dùng
if (typeof data === "string") {
  console.log(data.toUpperCase()); // OK — TypeScript biết data là string
}

// Nếu không kiểm tra, TypeScript sẽ báo lỗi
// data.toUpperCase(); // ❌ Lỗi!
```

> 💡 **Quy tắc:** Dùng `unknown` thay vì `any` khi không biết kiểu dữ liệu. Bắt buộc phải kiểm tra (narrow) trước khi sử dụng.

### 3.3 `void` — Hàm không trả về giá trị

```typescript
function logMessage(message: string): void {
  console.log(message);
  // Không return — hoặc return undefined
}

const result = logMessage("Hello"); // result có kiểu void
```

### 3.4 `never` — Giá trị không bao giờ xảy ra

```typescript
// Hàm luôn throw error — không bao giờ trả về gì
function throwError(message: string): never {
  throw new Error(message);
}

// Hàm vòng lặp vô tận
function infiniteLoop(): never {
  while (true) {
    // làm gì đó
  }
}
```

> 💡 **Khi nào dùng `never`:** Khi muốn thể hiện "đoạn code này không thể chạm tới" hoặc "hàm không bao giờ return bình thường".

---

## 4. Object & Structural Types — Kiểu đối tượng

### 4.1 Interface — Định nghĩa cấu trúc đối tượng

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  isActive?: boolean; // Dấu ? = tùy chọn
}

const user: User = {
  id: 1,
  name: "Lan",
  email: "lan@example.com",
};
```

### 4.2 Type Alias — Đặt tên cho kiểu

```typescript
// Tương đương interface, dùng khi cần linh hoạt hơn
type User = {
  id: number;
  name: string;
  email: string;
};

// Union type
type Status = "pending" | "approved" | "rejected";

// Kết hợp nhiều kiểu
type ID = number | string;
```

| Interface | Type Alias |
|-----------|------------|
| Có thể merge (declaration merging) | Không merge được |
| Dùng cho object structure | Dùng cho mọi kiểu (union, intersection...) |
| Mở rộng bằng `extends` | Mở rộng bằng `&` |

> 💡 **Thực tế:** Với 90% trường hợp, dùng interface cho object và type alias cho union/intersection. Nếu code báo lỗi kiểu "cannot merge", chuyển sang type alias.

### 4.3 Array

```typescript
// Hai cách khai báo tương đương
const numbers: number[] = [1, 2, 3];
const names: Array<string> = ["Lan", "Nam", "Mai"];

// Mảng nhiều kiểu
const mixed: (number | string)[] = [1, "two", 3];
```

### 4.4 Tuple — Mảng cố định số phần tử và kiểu

```typescript
// Tuple: [kiểu_1, kiểu_2, ...]
const point: [number, number] = [10, 20];
const entry: [string, number] = ["age", 25];

// Dùng khi biết chắc số phần tử
const rgb: [number, number, number] = [255, 128, 0];
```

> ⚠️ **Cảnh báo:** Tuple không ngăn được thêm phần tử sai vị trí. Dùng named tuple để rõ ràng hơn:

```typescript
const entry: [id: number, name: string, age: number] = [1, "Lan", 25];
```

### 4.5 Enum — Tập hợp hằng số

```typescript
enum Status {
  Pending,   // 0
  Active,    // 1
  Inactive,  // 2
}

// Dùng
const current: Status = Status.Active;
console.log(Status[current]); // "Active"
```

```typescript
// Enum với giá trị tùy chỉnh
enum Priority {
  Low = "low",
  Medium = "medium",
  High = "high",
}

const p: Priority = Priority.High; // "high"
```

> 💡 **Mẹo:** Nếu chỉ cần literal types, dùng `const enum` hoặc plain object để tiết kiệm bundle size:

```typescript
const STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
// type Status = "pending" | "active"
```

### 4.6 Function Types

```typescript
// Khai báo kiểu hàm
type AddFn = (a: number, b: number) => number;

// Dùng
const add: AddFn = (x, y) => x + y;

// Với optional và default parameters
type GreetFn = (name: string, greeting?: string) => string;
const greet: GreetFn = (name, greeting = "Xin chào") => `${greeting}, ${name}`;
```

---

## 5. Advanced Types — Kiểu nâng cao

### 5.1 Union Types (`|`)

Giá trị có thể là **một trong nhiều** kiểu.

```typescript
type StringOrNumber = string | number;

let value: StringOrNumber = "hello";
value = 123;    // Được
// value = true; // ❌ Lỗi

// Hàm với union
function format(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase(); // TypeScript biết value là string
  }
  return value.toFixed(2); // TypeScript biết value là number
}
```

### 5.2 Intersection Types (`&`)

Kết hợp nhiều kiểu — phải có **tất cả** thuộc tính.

```typescript
interface Printable {
  print(): void;
}

interface Saveable {
  save(): void;
}

type Document = Printable & Saveable;
// Document có cả print() và save()
```

### 5.3 Literal Types

Kiểu là một **giá trị cụ thể**.

```typescript
// Literal string
type Direction = "up" | "down" | "left" | "right";
const move: Direction = "up";

// Literal number
type OneToFive = 1 | 2 | 3 | 4 | 5;
const num: OneToFive = 3;

// Kết hợp với type
type Config = {
  mode: "development" | "production";
  debug: boolean;
};
```

### 5.4 Template Literal Types

Tạo kiểu chuỗi theo pattern.

```typescript
type EventName = `on${string}`;
type CSSUnit = `${number}px` | `${number}rem` | `${number}%`;

const event: EventName = "onClick";    // OK
// const bad: EventName = "click";     // ❌ Lỗi

const size: CSSUnit = "16px";         // OK
// const bad: CSSUnit = "16em";        // ❌ Lỗi
```

### 5.5 Mapped Types

Tạo kiểu mới bằng cách biến đổi từng thuộc tính.

```typescript
// Biến tất cả thuộc tính thành optional
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Biến tất cả thuộc tính thành readonly
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Biến tất cả thuộc tính thành string
type Stringify<T> = {
  [P in keyof T]: string;
};

// Ví dụ thực tế
interface User {
  id: number;
  name: string;
  age: number;
}

type OptionalUser = Partial<User>;
// { id?: number; name?: string; age?: number; }
```

### 5.6 Conditional Types

Kiểu dựa trên điều kiện.

```typescript
// Nếu T extends string thì trả về string, không thì trả về never
type ExtractString<T> = T extends string ? string : never;

// Dùng với infer
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type A = ReturnType<() => number>;      // number
type B = ReturnType<() => string[]>;    // string[]
```

### 5.7 Indexed Access Types

Truy cập kiểu của một thuộc tính.

```typescript
interface User {
  id: number;
  name: string;
  address: {
    city: string;
    zip: string;
  };
}

type UserId = User["id"];                  // number
type UserName = User["name"];              // string
type Address = User["address"];            // { city: string; zip: string }
type City = User["address"]["city"];       // string

// Dùng keyof để lấy tất cả keys
type UserKeys = keyof User;                // "id" | "name" | "address"
```

### 5.8 Recursive Types — Kiểu tự tham chiếu

```typescript
// JSON structure
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// Tree structure
interface TreeNode {
  value: string;
  children?: TreeNode[];
}

const tree: TreeNode = {
  value: "root",
  children: [
    { value: "child1" },
    { value: "child2", children: [{ value: "grandchild" }] },
  ],
};
```

---

## 6. Type Narrowing — Thu hẹp kiểu

Narrowing là kiểm tra kiểu để TypeScript hiểu chính xác kiểu dữ liệu trong từng nhánh.

### 6.1 `typeof`

```typescript
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase(); // string
  }
  return value.toFixed(2); // number
}
```

### 6.2 `instanceof`

```typescript
class Dog {
  bark() { console.log("Woof!"); }
}

class Cat {
  meow() { console.log("Meow!"); }
}

function speak(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}
```

### 6.3 `in` operator

```typescript
interface Car {
  drive(): void;
}

interface Bike {
  pedal(): void;
}

function operate(vehicle: Car | Bike) {
  if ("drive" in vehicle) {
    vehicle.drive();
  } else {
    vehicle.pedal();
  }
}
```

### 6.4 Discriminated Unions — Tagged Unions

Dùng thuộc tính chung để phân biệt các dạng.

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  side: number;
}

type Shape = Circle | Square;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
  }
}
```

### 6.5 User-Defined Type Guards

Hàm kiểm tra kiểu tùy chỉnh.

```typescript
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function process(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // TypeScript biết value là string
  }
}
```

---

## 7. Type Assertions — Ép kiểu

### 7.1 `as` — Chỉ định kiểu

```typescript
// DOM trả về HTMLElement | null
const input = document.getElementById("myInput") as HTMLInputElement;
input.value; // OK — TypeScript biết đây là input
```

```typescript
//Ép từ any sang cụ thể
const data = fetchData() as { name: string; age: number };
```

> ⚠️ **Cảnh báo:** `as` không kiểm tra runtime. Nếu ép sai, code vẫn chạy nhưng sai logic.

```typescript
const wrong = {} as { name: string };
wrong.name.toUpperCase(); // Runtime error!
```

### 7.2 Non-null Assertion (`!`)

Nói với TypeScript: "Giá trị này **chắc chắn** không null/undefined".

```typescript
const element = document.getElementById("myDiv")!;
element.textContent = "Hello"; // Không cần check null
```

> ⚠️ **Cảnh báo:** Dùng khi **chắc chắn 100%** giá trị không null. Nếu sai → runtime crash.

### 7.3 Const Assertion (`as const`)

Biến thành hằng số, không thay đổi được.

```typescript
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
} as const;

// config.apiUrl = "other"; // ❌ Lỗi — không thể gán lại

// Kiểu chính xác
type Config = typeof config;
// type Config = { readonly apiUrl: "https://api.example.com"; readonly timeout: 5000; }
```

### 7.4 Satisfies Operator (`satisfies`)

Kiểm tra khớp kiểu mà **giữ nguyên** kiểu chi tiết.

```typescript
// Dùng as: mất thông tin literal type
const palette1 = {
  red: [255, 0, 0],
  green: "#00ff00",
} as const;

// Dùng satisfies: kiểm tra và giữ nguyên
const palette2 = {
  red: [255, 0, 0],
  green: "#00ff00",
} satisfies Record<string, string | readonly number[]>;

// palette2.red là readonly [255, 0, 0] — vẫn là array
// palette2.green là "#00ff00" — vẫn là string
```

---

## 8. Utility Types — Kiểu tiện ích

TypeScript cung sẵn các kiểu biến đổi phổ biến.

### 8.1 `Partial<T>` — Tất cả thuộc tính thành optional

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Dùng khi cập nhật một phần user
function updateUser(id: number, updates: Partial<User>) {
  // ...
}

updateUser(1, { name: "New Name" }); // Chỉ cần gửi field cần update
```

### 8.2 `Required<T>` — Tất cả thuộc tính thành bắt buộc

```typescript
interface Config {
  apiUrl?: string;
  timeout?: number;
}

function initApp(config: Required<Config>) {
  // Tất cả field đều bắt buộc khi dùng
}
```

### 8.3 `Readonly<T>` — Chặn thay đổi

```typescript
interface Point {
  x: number;
  y: number;
}

const origin: Readonly<Point> = { x: 0, y: 0 };
// origin.x = 10; // ❌ Lỗi
```

### 8.4 `Pick<T, K>` — Chọn một số thuộc tính

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Chỉ gửi thông tin công khai lên client
type PublicUser = Pick<User, "id" | "name" | "email">;
// { id: number; name: string; email: string; }
```

### 8.5 `Omit<T, K>` — Loại bỏ một số thuộc tính

```typescript
// Tương đương Pick — dùng cách nào cũng được
type UserWithoutPassword = Omit<User, "password">;
// { id: number; name: string; email: string; }
```

### 8.6 `Record<K, T>` — Tạo object map

```typescript
// Tạo object với key là string và value là number
type ScoreMap = Record<string, number>;

const scores: ScoreMap = {
  alice: 95,
  bob: 87,
};

// Dùng với enum hoặc union làm key
type Status = "pending" | "active" | "inactive";
const statusLabels: Record<Status, string> = {
  pending: "Đang chờ",
  active: "Hoạt động",
  inactive: "Không hoạt động",
};
```

### 8.7 `ReturnType<T>` — Lấy kiểu trả về của hàm

```typescript
function createUser(name: string, age: number) {
  return { name, age, id: Math.random() };
}

type User = ReturnType<typeof createUser>;
// { name: string; age: number; id: number; }
```

### 8.8 `Parameters<T>` — Lấy kiểu tham số

```typescript
type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number]

// Tạo wrapper function với cùng parameters
function logAndCreateUser(...args: Parameters<typeof createUser>) {
  console.log("Creating user:", args);
  return createUser(...args);
}
```

### 8.9 `Exclude<T, U>` và `Extract<T, U>`

```typescript
type T = string | number | boolean;

// Loại bỏ string
type A = Exclude<T, string>;    // number | boolean

// Chỉ giữ lại string
type B = Extract<T, string>;    // string
```

### 8.10 `NonNullable<T>` — Loại bỏ null và undefined

```typescript
type T = string | null | undefined | number;

type Clean = NonNullable<T>;    // string | number
```

---

## 9. Common Mistakes — Lỗi thường gặp

### ❌ Lỗi 1: Dùng `any` quá nhiều

```typescript
// Sai — mất hết lợi ích của TypeScript
function processData(data: any) {
  return data.foo.bar; // Không có gì cảnh báo
}

// Đúng — dùng unknown hoặc kiểu cụ thể
function processData(data: unknown) {
  if (typeof data === "object" && data !== null && "foo" in data) {
    // Xử lý an toàn
  }
}
```

### ❌ Lỗi 2: Quên kiểm tra `null` trước khi dùng

```typescript
// Sai
const input = document.getElementById("myInput");
input.value = "test"; // Runtime error nếu element không tồn tại

// Đúng
const input = document.getElementById("myInput");
if (input) {
  input.value = "test";
}

// Hoặc dùng optional chaining
const input2 = document.getElementById("myInput");
input2?.setAttribute("value", "test");
```

### ❌ Lỗi 3: Ép kiểu không đúng

```typescript
// Sai — không kiểm tra gì cả
const value = "123" as number; // TypeScript không cảnh báo
console.log(value.toFixed(2)); // Runtime error!

// Đúng — luôn đảm bảo kiểu thực sự
function parseNumber(value: string): number {
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error("Invalid number");
  }
  return parsed;
}
```

### ❌ Lỗi 4: Object.assign thay vì spread

```typescript
// Sai — có thể ghi đè undefined
const merged = Object.assign({}, defaultConfig, userConfig);

// Đúng — spread không ghi đè undefined
const merged = { ...defaultConfig, ...userConfig };
```

### ❌ Lỗi 5: Không dùng discriminated union cho state phức tạp

```typescript
// Sai — không rõ ràng, dễ sai
type State = {
  loading: boolean;
  data: User | null;
  error: Error | null;
};

// Đúng — rõ ràng, TypeScript tự narrow
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: Error };
```

### ❌ Lỗi 6: Dùng `as` để fix lỗi type thay vì fix type đúng

```typescript
// Sai — che lỗp vấn đề
const value = someFunction() as string;

// Đúng — tìm hiểu tại sao type không khớp và fix
const value = someFunction();
if (typeof value !== "string") {
  throw new Error("Expected string");
}
```

---

## 10. Tips & Best Practices

### 💡 Tip 1: Bật strict mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

`strict: true` bật tất cả strict checks, bao gồm:
- `strictNullChecks` — bắt buộc kiểm tra null/undefined
- `noImplicitAny` — không cho phép `any` ngầm định
- `strictFunctionTypes` — kiểm tra function type chặt chẽ hơn

### 💡 Tip 2: Dùng `unknown` thay vì `any`

```typescript
// Thay vì
function parseJSON(json: any): any { ... }

// Hãy
function parseJSON(json: string): unknown { ... }
```

### 💡 Tip 3: Dùng `satisfies` khi cần cả kiểm tra và inference

```typescript
// as const không cho phép spread
const config = {
  port: 3000,
  host: "localhost",
} as const;

// satisfies vừa kiểm tra, vừa giữ type chính xác
const config = {
  port: 3000,
  host: "localhost",
} satisfies Record<string, number | string>;
```

### 💡 Tip 4: Tạo custom type guards cho business logic

```typescript
function isAdult(user: unknown): user is { age: number } {
  return (
    typeof user === "object" &&
    user !== null &&
    "age" in user &&
    typeof (user as any).age === "number" &&
    (user as any).age >= 18
  );
}

if (isAdult(data)) {
  console.log(data.age); // TypeScript biết data có age
}
```

### 💡 Tip 5: Dùng branded types để phân biệt các primitive cùng kiểu

```typescript
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

function getUser(id: UserId): User { ... }
function getOrder(id: OrderId): Order { ... }

const userId = "123" as UserId;
const orderId = "456" as OrderId;

getUser(userId);    // OK
getUser(orderId);   // ❌ Lỗi — nhầm OrderId với UserId
```

### 💡 Tip 6: Thứ tự đọc type

Khi gặp type phức tạp, đọc từ phải sang trái:

```typescript
type A = Promise<Array<Record<string, { nested: string }>>>;
// A là Promise chứa Array của Record (string → { nested: string })
```

### 💡 Tip 7: Tránh `!` khi có thể

```typescript
// Tránh
const name = user!.name;

// Thích
if (user) {
  const name = user.name;
}

// Hoặc dùng optional chaining
const name = user?.name;
```

### 💡 Tip 8: Dùng type cho logic, interface cho object

```typescript
// Type cho union/intersection
type Result = Success | Error;
type Config = A & B & C;

// Interface cho object structure
interface User {
  name: string;
  age: number;
}
```

---

## Tổng kết

```
TypeScript Type System
├── Primitives        → string, number, boolean, null, undefined
├── Special           → any, unknown, void, never
├── Structures        → Object, Array, Tuple, Function, Enum, Class
├── Advanced          → Union (|), Intersection (&), Literal, Mapped, Conditional
├── Narrowing         → typeof, instanceof, in, Guards, Discriminated Unions
├── Assertions        → as, !, as const, satisfies
└── Utilities         → Partial, Required, Pick, Omit, Record, ReturnType...
```

### Checklist khi code TypeScript

- [ ] Bật `strict: true` trong tsconfig
- [ ] Dùng `unknown` thay vì `any`
- [ ] Kiểm tra `null/undefined` trước khi dùng
- [ ] Dùng discriminated unions cho state phức tạp
- [ ] Tránh `as` để che lỗi type
- [ ] Viết type guards cho business logic phức tạp
- [ ] Dùng utility types thay vì viết lại từ đầu

---

> **Ghi chú:** Tài liệu này tập trung vào practical usage. Để tham khảo đầy đủ, xem [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/).
