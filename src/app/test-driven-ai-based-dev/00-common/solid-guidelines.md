# SOLID Principles and DRY Guidelines for Code Generation

## Overview
This document provides comprehensive guidelines for implementing SOLID principles and DRY (Don't Repeat Yourself) in code generation. These guidelines are specifically structured for AI systems to generate maintainable, extensible, and clean code.

## SOLID Principles Implementation Guide

### 1. Single Responsibility Principle (SRP)
**Core Rule**: A class/component should have only ONE reason to change.

#### Implementation Requirements
- Each class must have exactly one primary responsibility
- Class name must clearly indicate its single responsibility
- Methods in the class must relate directly to the class's responsibility
- If a class has multiple responsibilities, split it into separate classes

#### Example Implementation
```typescript
// ❌ INCORRECT: Multiple responsibilities
class UserManager {
  saveUser(user: User): void { /* database logic */ }
  validateUserEmail(email: string): boolean { /* validation logic */ }
  sendWelcomeEmail(user: User): void { /* email logic */ }
}

// ✅ CORRECT: Single responsibility classes
class UserRepository {
  saveUser(user: User): void { /* database logic only */ }
  findUserById(id: string): User { /* database logic only */ }
}

class UserValidator {
  validateEmail(email: string): boolean { /* validation logic only */ }
  validateUsername(username: string): boolean { /* validation logic only */ }
}

class UserNotificationService {
  sendWelcomeEmail(user: User): void { /* email logic only */ }
  sendPasswordReset(user: User): void { /* email logic only */ }
}
```

#### Anti-patterns to Avoid
- God classes that handle multiple concerns
- Classes with "and" in their names (e.g., `UserAndOrderManager`)
- Methods that don't relate to the class's primary responsibility
- Classes that change for multiple reasons

### 2. Open/Closed Principle (OCP)
**Core Rule**: Software entities should be open for extension but closed for modification.

#### Implementation Requirements
- Use interfaces and abstract classes to define contracts
- Implement new functionality through inheritance or composition
- Design extension points for anticipated changes
- Use strategy pattern for varying behaviors

#### Example Implementation
```typescript
// ❌ INCORRECT: Modifying existing code for new functionality
class PaymentProcessor {
  processPayment(type: string, amount: number): void {
    if (type === 'credit') { /* credit card logic */ }
    else if (type === 'debit') { /* debit card logic */ }
    // Adding new payment type requires modifying this class
  }
}

// ✅ CORRECT: Open for extension
interface PaymentStrategy {
  process(amount: number): void;
}

class CreditCardPayment implements PaymentStrategy {
  process(amount: number): void { /* credit card logic */ }
}

class DebitCardPayment implements PaymentStrategy {
  process(amount: number): void { /* debit card logic */ }
}

// New payment methods can be added without modifying existing code
class CryptoPayment implements PaymentStrategy {
  process(amount: number): void { /* crypto logic */ }
}

class PaymentProcessor {
  constructor(private strategy: PaymentStrategy) {}
  
  processPayment(amount: number): void {
    this.strategy.process(amount);
  }
}
```

#### Anti-patterns to Avoid
- Large if/else or switch statements for type checking
- Modifying existing classes to add new functionality
- Tight coupling between classes
- Concrete class dependencies instead of interfaces

### 3. Liskov Substitution Principle (LSP)
**Core Rule**: Subtypes must be substitutable for their base types without altering program correctness.

#### Implementation Requirements
- Derived classes must fulfill base class contracts
- Override methods must accept same parameters as base class
- Override methods must return same type or subtype
- Override methods must not throw new exceptions

#### Example Implementation
```typescript
// ❌ INCORRECT: Violating LSP
class Bird {
  fly(): void { /* flying logic */ }
}

class Penguin extends Bird {
  fly(): void {
    throw new Error("Penguins can't fly"); // Violates LSP
  }
}

// ✅ CORRECT: Proper abstraction
interface Movable {
  move(): void;
}

class FlyingBird implements Movable {
  move(): void { /* flying logic */ }
}

class SwimmingBird implements Movable {
  move(): void { /* swimming logic */ }
}
```

#### Anti-patterns to Avoid
- Empty method implementations in derived classes
- Throwing exceptions for unsupported operations
- Changing method behavior in unexpected ways
- Breaking base class invariants

### 4. Interface Segregation Principle (ISP)
**Core Rule**: Clients should not be forced to depend on interfaces they don't use.

#### Implementation Requirements
- Create small, focused interfaces
- Split large interfaces into smaller ones
- Clients should only implement methods they need
- Use composition of interfaces for complex behaviors

#### Example Implementation
```typescript
// ❌ INCORRECT: Fat interface
interface WorkerInterface {
  work(): void;
  eat(): void;
  sleep(): void;
  calculateSalary(): number;
  generateReport(): string;
}

// ✅ CORRECT: Segregated interfaces
interface Workable {
  work(): void;
}

interface Feedable {
  eat(): void;
  sleep(): void;
}

interface Payable {
  calculateSalary(): number;
}

interface Reportable {
  generateReport(): string;
}

// Classes implement only what they need
class HumanWorker implements Workable, Feedable, Payable {
  work(): void { /* work logic */ }
  eat(): void { /* eat logic */ }
  sleep(): void { /* sleep logic */ }
  calculateSalary(): number { /* salary logic */ }
}

class RobotWorker implements Workable, Reportable {
  work(): void { /* work logic */ }
  generateReport(): string { /* report logic */ }
}
```

#### Anti-patterns to Avoid
- Large, monolithic interfaces
- Interfaces with unrelated methods
- Classes implementing unused methods
- One-size-fits-all interfaces

### 5. Dependency Inversion Principle (DIP)
**Core Rule**: High-level modules should not depend on low-level modules. Both should depend on abstractions.

#### Implementation Requirements
- Depend on abstractions (interfaces/abstract classes)
- Use dependency injection
- Configure dependencies externally
- Create abstractions based on high-level requirements

#### Example Implementation
```typescript
// ❌ INCORRECT: Direct dependency on concrete class
class OrderService {
  private database = new MySQLDatabase(); // Tight coupling
  
  saveOrder(order: Order): void {
    this.database.save(order);
  }
}

// ✅ CORRECT: Depending on abstractions
interface Database {
  save(data: any): void;
  find(id: string): any;
}

class OrderService {
  constructor(private database: Database) {} // Dependency injection
  
  saveOrder(order: Order): void {
    this.database.save(order);
  }
}

// Different implementations can be injected
class MySQLDatabase implements Database {
  save(data: any): void { /* MySQL logic */ }
  find(id: string): any { /* MySQL logic */ }
}

class MongoDatabase implements Database {
  save(data: any): void { /* MongoDB logic */ }
  find(id: string): any { /* MongoDB logic */ }
}
```

#### Anti-patterns to Avoid
- Direct instantiation of dependencies
- Concrete class dependencies
- Static/global state
- Service locator pattern

## DRY (Don't Repeat Yourself) Implementation Guide

### Core Principles
1. Every piece of knowledge must have a single, unambiguous representation
2. Code duplication is a symptom of poor design
3. Abstract common patterns into reusable components

### Implementation Requirements

#### 1. Code Level DRY
```typescript
// ❌ INCORRECT: Repeating validation logic
class UserService {
  createUser(email: string): void {
    if (!email.includes('@') || !email.includes('.')) {
      throw new Error('Invalid email');
    }
    // create user
  }
  
  updateUser(email: string): void {
    if (!email.includes('@') || !email.includes('.')) {
      throw new Error('Invalid email');
    }
    // update user
  }
}

// ✅ CORRECT: Single validation implementation
class EmailValidator {
  static validate(email: string): boolean {
    return email.includes('@') && email.includes('.');
  }
}

class UserService {
  createUser(email: string): void {
    if (!EmailValidator.validate(email)) {
      throw new Error('Invalid email');
    }
    // create user
  }
  
  updateUser(email: string): void {
    if (!EmailValidator.validate(email)) {
      throw new Error('Invalid email');
    }
    // update user
  }
}
```

#### 2. Architecture Level DRY
```typescript
// ❌ INCORRECT: Repeating repository pattern
class UserRepository {
  findById(id: string): User { /* database logic */ }
  findAll(): User[] { /* database logic */ }
  save(user: User): void { /* database logic */ }
}

class OrderRepository {
  findById(id: string): Order { /* same database logic */ }
  findAll(): Order[] { /* same database logic */ }
  save(order: Order): void { /* same database logic */ }
}

// ✅ CORRECT: Generic repository pattern
interface Entity {
  id: string;
}

class GenericRepository<T extends Entity> {
  findById(id: string): T { /* database logic */ }
  findAll(): T[] { /* database logic */ }
  save(entity: T): void { /* database logic */ }
}

class UserRepository extends GenericRepository<User> {
  // Additional user-specific methods only
}

class OrderRepository extends GenericRepository<Order> {
  // Additional order-specific methods only
}
```

### DRY Anti-patterns to Avoid
1. **Copy-Paste Programming**
   - Copying code blocks instead of abstracting common functionality
   - Duplicating business logic across services

2. **Premature Abstraction**
   ```typescript
   // ❌ INCORRECT: Over-abstraction
   interface IEntityFactoryCreatorBuilder {
     // Too many layers of abstraction
   }
   
   // ✅ CORRECT: Appropriate abstraction
   interface EntityFactory {
     create(): Entity;
   }
   ```

3. **Duplicate Configuration**
   ```typescript
   // ❌ INCORRECT: Repeating configuration
   const config1 = {
     apiUrl: 'https://api.example.com',
     timeout: 5000
   };
   
   const config2 = {
     apiUrl: 'https://api.example.com', // Duplication
     timeout: 5000
   };
   
   // ✅ CORRECT: Single configuration source
   const config = {
     apiUrl: 'https://api.example.com',
     timeout: 5000
   };
   ```

## Code Generation Instructions for AI Systems

### 1. Pre-Generation Analysis
1. Identify the primary responsibility of each class/component
2. Determine extension points and variation axes
3. Map out class hierarchies and interfaces
4. Identify common patterns for abstraction

### 2. Generation Process
1. Start with interfaces/abstract classes
2. Implement concrete classes following SOLID
3. Use dependency injection for dependencies
4. Extract common code into shared utilities
5. Review for DRY violations

### 3. Validation Checklist
- [ ] Each class has a single, clear responsibility
- [ ] New features can be added without modifying existing code
- [ ] Derived classes are substitutable for base classes
- [ ] Interfaces are small and focused
- [ ] Dependencies are injected and based on abstractions
- [ ] No code duplication exists
- [ ] Common patterns are abstracted appropriately

### 4. Common Patterns to Implement
1. **Repository Pattern** for data access
2. **Strategy Pattern** for varying behaviors
3. **Factory Pattern** for object creation
4. **Observer Pattern** for event handling
5. **Decorator Pattern** for extending functionality

## Example Full Implementation

```typescript
// Example of a feature implementing all SOLID principles and DRY

// 1. Interfaces (ISP)
interface Authenticatable {
  authenticate(credentials: Credentials): Promise<boolean>;
}

interface TokenGenerator {
  generateToken(user: User): string;
}

interface UserFinder {
  findByEmail(email: string): Promise<User | null>;
}

// 2. Abstract Base (OCP)
abstract class AuthenticationService implements Authenticatable {
  constructor(
    protected userFinder: UserFinder,
    protected tokenGenerator: TokenGenerator
  ) {}

  abstract authenticate(credentials: Credentials): Promise<boolean>;
}

// 3. Concrete Implementation (SRP)
class EmailAuthenticationService extends AuthenticationService {
  async authenticate(credentials: EmailCredentials): Promise<boolean> {
    const user = await this.userFinder.findByEmail(credentials.email);
    if (!user) return false;
    
    const isValid = await this.validatePassword(credentials.password, user.password);
    if (!isValid) return false;
    
    return true;
  }

  private async validatePassword(input: string, stored: string): Promise<boolean> {
    // Password validation logic
    return true;
  }
}

// 4. Factory (DIP)
class AuthenticationServiceFactory {
  static create(type: 'email' | 'oauth'): AuthenticationService {
    const userFinder = new UserRepository();
    const tokenGenerator = new JWTTokenGenerator();
    
    switch (type) {
      case 'email':
        return new EmailAuthenticationService(userFinder, tokenGenerator);
      case 'oauth':
        return new OAuthAuthenticationService(userFinder, tokenGenerator);
      default:
        throw new Error('Unknown authentication type');
    }
  }
}

// Usage
const authService = AuthenticationServiceFactory.create('email');
const isAuthenticated = await authService.authenticate({
  email: 'user@example.com',
  password: 'password123'
});
```

This example demonstrates:
- SRP: Each class has one responsibility
- OCP: New auth methods can be added without modification
- LSP: All auth services are substitutable
- ISP: Interfaces are segregated by functionality
- DIP: Dependencies are injected and based on abstractions
- DRY: No code duplication, common functionality abstracted 