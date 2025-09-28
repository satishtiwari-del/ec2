# Object-Oriented Design & Coding Guidelines

## Overview
This document provides comprehensive guidelines for Object-Oriented Design (OOD) and coding practices. These guidelines are specifically structured for AI systems to generate maintainable, extensible, and clean object-oriented code.

## Required References
- **[SOLID Principles and DRY Guidelines](solid-guidelines.md)** - **MUST FOLLOW** for implementing SOLID principles and maintaining DRY code
- This document complements the SOLID guidelines by providing specific OOD patterns, examples, and implementation rules

## Architectural Context

### Layer Separation
- **Presentation Layer**: Components, Views, UI Services
  - Handle user interaction
  - Manage UI state
  - Format data for display
  - Route user actions to business layer

- **Business Layer**: Services, Use Cases, Domain Logic
  - Implement business rules
  - Orchestrate operations
  - Handle domain logic
  - Manage transactions

- **Data Layer**: Repositories, Data Access, External Services
  - Handle data persistence
  - Manage data access
  - Interface with external services
  - Implement caching strategies

### Cross-Cutting Concerns
- **Error Handling**
  - Use custom error hierarchies
  - Implement global error handling
  - Provide meaningful error messages
  - Include error recovery mechanisms

- **Logging**
  - Log important business events
  - Track system operations
  - Monitor performance metrics
  - Audit security events

- **Authentication/Authorization**
  - Implement security boundaries
  - Manage user identity
  - Control access to resources
  - Handle security tokens

- **Caching**
  - Cache frequently accessed data
  - Implement cache invalidation
  - Use appropriate cache levels
  - Handle cache synchronization

- **Configuration Management**
  - Manage environment settings
  - Handle feature flags
  - Store sensitive data securely
  - Support multiple environments

### Communication Patterns
- **Event-based Communication**
  - Use publish/subscribe pattern
  - Implement event handlers
  - Manage event queues
  - Handle event failures

- **Request-Response Pattern**
  - Define clear contracts
  - Handle timeouts
  - Implement retry logic
  - Manage response errors

- **Publisher-Subscriber Pattern**
  - Decouple components
  - Handle message queues
  - Implement message handlers
  - Manage subscriptions

## Core OOD Principles

### 1. Class Design Rules
- Each class MUST have a single, well-defined responsibility
- Class names MUST be nouns, using PascalCase (e.g., `UserService`, `OrderProcessor`)
- Properties MUST be nouns or adjectives (e.g., `userName`, `isActive`)
- Methods MUST be verbs or verb phrases (e.g., `processOrder`, `validateInput`)
- Class size SHOULD NOT exceed 300 lines (excluding comments and whitespace)

### 2. Inheritance Guidelines
- Use inheritance ONLY when "is-a" relationship exists
- Prefer composition over inheritance for "has-a" relationships
- Maximum inheritance depth: 3 levels
- Abstract classes MUST have "Abstract" prefix (e.g., `AbstractRepository`)
- Never inherit from concrete classes marked as `final`

### 3. Interface Design
- Interface names MUST start with "I" (e.g., `IUserService`)
- One interface SHOULD serve one specific client type
- Keep interfaces small and focused (max 5-7 methods)
- Use method signatures that are implementation-agnostic
- Document interface contracts with clear method descriptions

### 4. Encapsulation Rules
- All properties MUST be private by default
- Use protected ONLY if inheritance access is required
- Public properties MUST have explicit business justification
- Provide controlled access through getters/setters
- Use TypeScript's access modifiers consistently

### 5. Method Design
- Methods SHOULD do one thing only
- Maximum method length: 20 lines
- Maximum parameters: 3 (use parameter objects for more)
- Return types MUST be consistent and well-defined
- Method names MUST clearly indicate their purpose

## Implementation Patterns

### 1. Constructor Pattern
```typescript
class ServiceClass {
    private readonly dependency1: Dependency1;
    private readonly dependency2: Dependency2;

    constructor(
        dependency1: Dependency1,
        dependency2: Dependency2
    ) {
        this.dependency1 = dependency1;
        this.dependency2 = dependency2;
    }
}
```

### 2. Property Pattern
```typescript
class DataClass {
    private _value: string;

    get value(): string {
        return this._value;
    }

    set value(newValue: string) {
        if (!this.validateValue(newValue)) {
            throw new Error('Invalid value');
        }
        this._value = newValue;
    }
}
```

### 3. Method Pattern
```typescript
class ProcessorClass {
    public processItem(item: Item): Result {
        this.validateItem(item);
        const processedData = this.transformItem(item);
        return this.createResult(processedData);
    }

    private validateItem(item: Item): void {
        if (!item) throw new Error('Item is required');
    }

    private transformItem(item: Item): ProcessedData {
        // transformation logic
    }

    private createResult(data: ProcessedData): Result {
        // result creation logic
    }
}
```

## Common Design Patterns Implementation

### 1. Factory Pattern
```typescript
interface IProductFactory {
    createProduct(type: ProductType): IProduct;
}

class ProductFactory implements IProductFactory {
    public createProduct(type: ProductType): IProduct {
        switch (type) {
            case ProductType.TypeA:
                return new ProductA();
            case ProductType.TypeB:
                return new ProductB();
            default:
                throw new Error('Unknown product type');
        }
    }
}
```

### 2. Strategy Pattern
```typescript
interface IStrategy {
    execute(data: InputData): OutputData;
}

class Context {
    private strategy: IStrategy;

    constructor(strategy: IStrategy) {
        this.strategy = strategy;
    }

    public setStrategy(strategy: IStrategy): void {
        this.strategy = strategy;
    }

    public executeStrategy(data: InputData): OutputData {
        return this.strategy.execute(data);
    }
}
```

### 3. Observer Pattern
```typescript
interface IObserver {
    update(data: any): void;
}

class Subject {
    private observers: IObserver[] = [];

    public attach(observer: IObserver): void {
        this.observers.push(observer);
    }

    public detach(observer: IObserver): void {
        const index = this.observers.indexOf(observer);
        if (index !== -1) {
            this.observers.splice(index, 1);
        }
    }

    protected notify(data: any): void {
        this.observers.forEach(observer => observer.update(data));
    }
}
```

### 4. Repository Pattern
```typescript
interface IGenericRepository<T> {
    findById(id: string): Promise<T>;
    findAll(): Promise<T[]>;
    create(entity: T): Promise<T>;
    update(id: string, entity: T): Promise<T>;
    delete(id: string): Promise<void>;
}

class MongoRepository<T> implements IGenericRepository<T> {
    constructor(
        private readonly collection: string,
        private readonly mapper: IEntityMapper<T>
    ) {}

    async findById(id: string): Promise<T> {
        const result = await this.collection.findOne({ _id: id });
        return this.mapper.toDomain(result);
    }

    async create(entity: T): Promise<T> {
        const data = this.mapper.toPersistence(entity);
        const result = await this.collection.insertOne(data);
        return this.mapper.toDomain(result);
    }
}
```

### 5. Unit of Work Pattern
```typescript
interface IUnitOfWork {
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
}

class UnitOfWork implements IUnitOfWork {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly orderRepository: IOrderRepository,
        private readonly connection: IDatabaseConnection
    ) {}

    async beginTransaction(): Promise<void> {
        await this.connection.startTransaction();
    }

    async commit(): Promise<void> {
        await this.connection.commitTransaction();
    }

    async rollback(): Promise<void> {
        await this.connection.rollbackTransaction();
    }
}
```

### 6. Decorator Pattern
```typescript
interface IService {
    execute(): Promise<Result>;
}

class LoggingDecorator implements IService {
    constructor(private service: IService) {}

    async execute(): Promise<Result> {
        console.log('Before execution');
        try {
            const result = await this.service.execute();
            console.log('Execution successful');
            return result;
        } catch (error) {
            console.log('Execution failed', error);
            throw error;
        }
    }
}
```

## Error Handling Patterns

### Domain Errors
```typescript
abstract class DomainError extends Error {
    constructor(
        message: string, 
        public readonly code: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

class ValidationError extends DomainError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', context);
    }
}

class BusinessRuleError extends DomainError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'BUSINESS_RULE_ERROR', context);
    }
}
```

### Error Handling Strategy
- Use custom error hierarchies for domain-specific errors
- Include error codes and contextual information
- Implement global error handling at application boundaries
- Provide meaningful error messages for debugging
- Include error recovery mechanisms where appropriate
- Log errors with proper severity levels
- Handle async errors consistently

## Testing Patterns

### Test Organization
```typescript
describe('OrderService', () => {
    describe('Business Rules', () => {
        it('should calculate order total correctly', () => {
            // Business logic test
        });
        
        it('should validate order items', () => {
            // Validation test
        });
    });
    
    describe('Integration', () => {
        it('should save order to database', async () => {
            // Integration test
        });
        
        it('should notify customer after order creation', async () => {
            // Integration test
        });
    });
    
    describe('Error Handling', () => {
        it('should handle validation errors', () => {
            // Error scenario test
        });
        
        it('should handle database errors', async () => {
            // Error scenario test
        });
    });
});
```

### Test Data Builders
```typescript
class OrderBuilder {
    private order: Order = {
        id: '',
        items: [],
        status: OrderStatus.New,
        customerId: '',
        createdAt: new Date()
    };

    withId(id: string): OrderBuilder {
        this.order.id = id;
        return this;
    }

    withItems(items: OrderItem[]): OrderBuilder {
        this.order.items = items;
        return this;
    }

    withStatus(status: OrderStatus): OrderBuilder {
        this.order.status = status;
        return this;
    }

    withCustomerId(customerId: string): OrderBuilder {
        this.order.customerId = customerId;
        return this;
    }

    build(): Order {
        return { ...this.order };
    }
}
```

## Performance Patterns

### Lazy Loading
```typescript
class LazyLoader<T> {
    private instance: T | null = null;

    constructor(private factory: () => T) {}

    get(): T {
        if (!this.instance) {
            this.instance = this.factory();
        }
        return this.instance;
    }

    reset(): void {
        this.instance = null;
    }
}

// Usage
const heavyService = new LazyLoader(() => new ExpensiveService());
```

### Caching Strategy
```typescript
interface ICacheStrategy {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

class CacheDecorator<T> implements ICacheStrategy {
    constructor(
        private cache: ICacheStrategy,
        private ttl: number = 3600
    ) {}

    async get<T>(key: string): Promise<T | null> {
        const cached = await this.cache.get<T>(key);
        if (cached) {
            return cached;
        }
        return null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        await this.cache.set(key, value, this.ttl);
    }
}
```

## Versioning Patterns

### Data Version Control
```typescript
interface IVersioned {
    version: number;
    updatedAt: Date;
}

class VersionedEntity implements IVersioned {
    version: number = 1;
    updatedAt: Date = new Date();

    protected incrementVersion(): void {
        this.version++;
        this.updatedAt = new Date();
    }
}

class Order extends VersionedEntity {
    constructor(
        public readonly id: string,
        public items: OrderItem[]
    ) {
        super();
    }

    addItem(item: OrderItem): void {
        this.items.push(item);
        this.incrementVersion();
    }
}
```

### Migration Strategy
- Use version control in entities for data evolution
- Implement upgrade paths for breaking changes
- Handle backward compatibility in APIs
- Document breaking changes and migration steps
- Provide migration scripts and tools
- Test migration paths thoroughly
- Include rollback mechanisms

## Validation Checklist

### Class Design
- [ ] SOLID principles followed ([see SOLID Guidelines](solid-guidelines.md))
- [ ] Class name is a noun in PascalCase
- [ ] Properties are properly encapsulated
- [ ] Methods follow verb naming convention
- [ ] Class size is within limits

### Method Design
- [ ] Method does one thing only
- [ ] Method name clearly indicates purpose
- [ ] Parameter count ≤ 3
- [ ] Return type is well-defined
- [ ] Method length ≤ 20 lines

### Interface Design
- [ ] Interface has "I" prefix
- [ ] Methods are cohesive
- [ ] Interface is focused and minimal
- [ ] Method signatures are implementation-agnostic
- [ ] Contracts are well-documented

### Pattern Usage
- [ ] Appropriate design pattern selected
- [ ] Pattern implemented correctly
- [ ] No anti-patterns present
- [ ] Dependencies properly injected
- [ ] Encapsulation maintained

### Architecture Compliance
- [ ] Follows layered architecture principles
- [ ] Implements proper separation of concerns
- [ ] Handles cross-cutting concerns appropriately
- [ ] Uses correct communication patterns
- [ ] Maintains proper dependency flow
- [ ] Implements proper error boundaries
- [ ] Follows security best practices

### Performance Considerations
- [ ] Implements proper lazy loading where needed
- [ ] Uses appropriate caching strategies
- [ ] Handles resource cleanup properly
- [ ] Considers memory management
- [ ] Implements connection pooling
- [ ] Uses efficient data structures
- [ ] Optimizes database queries

### Error Handling
- [ ] Uses proper error hierarchies
- [ ] Implements global error handling
- [ ] Provides meaningful error messages
- [ ] Includes recovery mechanisms
- [ ] Logs errors appropriately
- [ ] Handles async errors correctly
- [ ] Implements retry mechanisms

### Testing Strategy
- [ ] Has comprehensive unit tests
- [ ] Includes integration tests
- [ ] Tests error scenarios
- [ ] Uses test data builders
- [ ] Implements test helpers
- [ ] Follows test organization patterns
- [ ] Has proper test coverage

## Code Generation Instructions for LLMs

### 1. Class Generation Process
1. Identify the primary responsibility
2. Define public interface first
3. Implement private members
4. Add constructor with dependencies
5. Implement methods
6. Validate against checklist

### 2. Method Generation Process
1. Define input parameters and return type
2. Implement input validation
3. Add core logic
4. Handle error cases
5. Return appropriate result

### 3. Interface Generation Process
1. Identify client requirements
2. Define method contracts
3. Add documentation
4. Validate interface segregation
5. Review for completeness

### 4. Pattern Selection Process
1. Analyze problem requirements
2. Match with appropriate pattern
3. Implement pattern structure following [SOLID principles](solid-guidelines.md)
4. Add specific logic
5. Validate pattern usage against both OOD and SOLID guidelines

## Example Full Implementation
> Note: This example demonstrates both OOD patterns and SOLID principles. For more SOLID-specific examples, refer to the [SOLID Guidelines Implementation Examples](solid-guidelines.md#example-full-implementation)

```typescript
// Example of a well-structured OOD implementation

interface IOrderProcessor {
    processOrder(order: Order): Promise<OrderResult>;
    validateOrder(order: Order): boolean;
}

interface IOrderRepository {
    save(order: Order): Promise<void>;
    findById(id: string): Promise<Order>;
}

class OrderProcessor implements IOrderProcessor {
    constructor(
        private readonly repository: IOrderRepository,
        private readonly validator: IOrderValidator,
        private readonly notifier: IOrderNotifier
    ) {}

    public async processOrder(order: Order): Promise<OrderResult> {
        if (!this.validateOrder(order)) {
            throw new OrderValidationError('Invalid order');
        }

        try {
            await this.repository.save(order);
            await this.notifier.notifyCustomer(order);
            
            return {
                orderId: order.id,
                status: OrderStatus.Processed,
                timestamp: new Date()
            };
        } catch (error) {
            throw new OrderProcessingError('Failed to process order', error);
        }
    }

    public validateOrder(order: Order): boolean {
        return this.validator.validate(order);
    }
}
```

This example demonstrates:
- Clear interface definitions
- Proper dependency injection
- Single responsibility principle
- Error handling
- Clean method implementations
- Appropriate naming conventions 