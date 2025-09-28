# Technical Use Case General Guidelines

## Overview
This document provides guidelines for creating technical use cases that translate functional requirements into actionable engineering specifications. **Functional Use Cases are the primary input for all technical use cases.**

## Core Principles

### 1. Traceability to Functional Use Cases
- Every technical use case must reference its corresponding functional use case(s)
- Maintain clear mapping for traceability

### 2. Technical Inputs

**IMPORTANT: The AI system MUST ask for these inputs BEFORE generating technical use cases.**

#### Use Case Analysis
For each functional use case identified, the AI system should gather the following technical specifications:

**API Endpoints:**
- **Existing API endpoints** to be used (provide suggestions based on common patterns)
- **New API endpoints** required (ask user for naming conventions and suggest RESTful patterns)
- **API infrastructure** to leverage (existing services, stores, authentication, etc.)

**UI/UX Components:**
- **Existing components** to reuse (suggest common UI patterns)
- **Components to extend** (identify base components and required modifications)
- **New components** needed (suggest component architecture and naming)
- **Wireframe diagrams** (request Excalidraw diagrams or PNG/JPG mockups)

**Technical Infrastructure:**
- **Database schemas** and data models
- **External service integrations** (payment, email, SMS, etc.)
- **Authentication and authorization** requirements
- **Performance and scalability** considerations
- **Security and compliance** requirements
- **Error handling and logging** specifications
- **Monitoring and observability** requirements

**OOAD Principles and Patterns:**
- **SOLID principles** application (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- **Design patterns** to be implemented (Factory, Strategy, Observer, Command, Repository, etc.)
- **Class relationships** and inheritance hierarchies
- **Interface definitions** and abstractions
- **Dependency injection** and inversion of control
- **Encapsulation** and information hiding
- **Polymorphism** and method overriding
- **Composition over inheritance** decisions

#### Input Gathering Process
**The AI system MUST follow this process:**

1. **List all functional use cases** from the input document
2. **For each use case**, systematically ask for:
   - API endpoint specifications
   - UI/UX component requirements
   - Technical infrastructure needs
3. **Request diagrams and wireframes** to be included in the generated markdown file
4. **Identify and ask for any missing technical specifications** that need clarification
5. **Only proceed with technical use case generation AFTER all inputs are gathered**

### 3. Technical Focus
- Don't incude any code in Technical Use Cases.
- It's ok to include high level flow diagram (Use Mermaid)
- Specify system architecture and technology stack
- Detail data flow, integration points, and interfaces
- Define error handling and exception management
- Address security, compliance, and privacy requirements
- Include performance, scalability, and reliability considerations
- Document deployment, monitoring, and operational aspects
- Specify testability requirements and validation criteria
- Define interfaces and contracts for testing
- Include observability and monitoring for test validation
- **Apply OOAD principles and design patterns**
- **Define class structures and relationships**
- **Specify interface abstractions and implementations**

### 4. Structure Guidelines
- Use the technical use case template for consistency
- Each technical use case should include:
  - Reference to functional use case
  - Technical context and rationale
  - System/component architecture
  - Data model and flow
  - Integration and interface details
  - Error and exception handling
  - Security and compliance
  - Performance and scalability
  - Testability and validation criteria
  - Interfaces and contracts for testing
  - Observability and monitoring requirements
  - **OOAD principles and design patterns**
  - **Class and interface definitions**
  - **Object relationships and hierarchies**
  - Deployment and operations

### 5. Writing Style Guidelines
- Use precise technical language
- Be implementation-oriented, but clear and unambiguous
- Avoid business jargon unless quoting the functional use case
- Use diagrams or pseudocode where helpful
- Ensure all requirements are testable and measurable
- Define specific, quantifiable acceptance criteria
- Include technical scenarios and edge cases
- Specify validation criteria for implementation



### 6. Testability and Validation Requirements

#### Testability Design
- **Define interfaces and contracts** that enable testing (APIs, events, hooks)
- **Specify observability requirements** (logging, metrics, monitoring)
- **Include validation points** where system state can be verified
- **Define error conditions** and exception scenarios for testing

#### Validation Criteria
- **Specify measurable acceptance criteria** for each technical requirement
- **Define performance benchmarks** and scalability thresholds
- **Include security validation requirements** (authentication, authorization, data protection)
- **Specify compliance requirements** (privacy, regulatory, accessibility)

#### Observability and Monitoring
- **Define logging requirements** for debugging and validation
- **Specify metrics and monitoring** for performance and health checks
- **Include error tracking** and alerting requirements
- **Define audit trails** for security and compliance validation

#### Integration Points for Testing
- **Specify API contracts** and data formats for integration testing
- **Define event interfaces** for asynchronous testing scenarios
- **Include database schemas** and data models for persistence testing
- **Specify external service interfaces** for end-to-end testing
- **Define class interfaces** and method signatures for unit testing
- **Specify design pattern implementations** for testing mock objects

### 7. Versioning and Traceability
- Maintain version control and change logs
- Link technical use cases to functional use case versions
- **Link to validation criteria and acceptance tests**
- **Track implementation progress and quality metrics**
- Document rationale for technical decisions

This guideline ensures technical use cases are actionable, testable, and fully traceable to business requirements, enabling robust engineering and delivery that supports the Red Phase test case generation process.

## Mechanics of Technical Use Case Document Generation

### Folder Structure and File Organization
 Must follow [`ng-ts-proj-structure-guidelines.md`](../00-common/ng-ts-proj-structure-guidelines.md)


### Document Generation Guidelines

#### Application-Level Documents
**When to Generate**: Complete application technical architecture with all modules
**Content Structure**:
- Application technical overview and architecture
- List of all modules with technical descriptions
- High-level technical use cases for each module
- Cross-module integration and API specifications
- Link to module level technical use case files
- System-wide technical constraints and requirements

#### Module-Level Documents
**When to Generate**: Complete module technical implementation with all features
**Content Structure**:
- Module technical overview and architecture
- List of all features within the module with technical specifications
- Link to feature level technical use case files
- Module-specific technical rules and constraints
- Cross-feature integration and API specifications
- Database schemas and data models

#### Feature-Level Documents
**When to Generate**: Individual feature technical implementation
**Content Structure**:
- Feature technical overview and implementation approach
- 5-10 comprehensive technical use cases
- Feature-specific technical rules and constraints
- API specifications and data requirements
- UI/UX component specifications
- Error handling and validation requirements

#### Enhancement-Level Documents
**When to Generate**: Feature enhancement technical implementation
**Content Structure**:
- Enhancement technical overview and implementation approach
- 3-5 technical use cases for enhancement
- Integration with parent feature technical specifications
- Additional technical rules and constraints
- API extensions and modifications

### Technical Use Case Prompt Instructions

#### Target Selection Process
1. **Identify Target Level**: Application, Module, Feature, or Enhancement
2. **Reference Functional Use Cases**: Link to corresponding functional use cases
3. **Specify Technical Requirements**: Architecture, technology stack, and constraints
4. **Choose Output Location**: Select appropriate folder structure

#### Prompt Template for Technical Use Cases
```
## Technical Requirements
**Architecture**: [System architecture and technology stack] (provide a list of suggestion based on repository content when asking for user input)
**API Specifications**: [Required endpoints and interfaces] (provide a list of suggestion based on repository content when asking for user input)
**UI/UX Components**: [Component specifications and wireframes] (provide a list of suggestion based on repository content when asking for user input)
**Integration Points**: [External services and APIs]
**Performance Requirements**: [Scalability and performance constraints]


### Quality Control Process

#### Pre-Generation Checklist
- [ ] Target level is clearly identified
- [ ] Functional use cases are referenced
- [ ] Technical context is well-defined
- [ ] Parent relationships are specified
- [ ] Output location is selected
- [ ] Naming conventions are followed
- [ ] Technical inputs are gathered

#### Post-Generation Validation
- [ ] Document follows technical use case template structure
- [ ] Technical use cases meet minimum count requirements
- [ ] Technical focus is maintained
- [ ] Functional use cases are properly referenced
- [ ] OOAD principles and patterns are applied
- [ ] Testability requirements are specified
- [ ] File is saved in correct location

### Integration Guidelines

#### Cross-Reference Management
- Link to functional use cases using their IDs
- Maintain parent-child relationships in technical hierarchy
- Update parent documents when children are added
- Ensure consistency across related technical documents
- Link to technical specifications and API documentation

#### Version Control
- Use descriptive commit messages with technical context
- Tag major technical versions
- Maintain technical change logs
- Track technical document relationships
- Version API specifications and interfaces

### Example Workflow

1. **Solution Architect** identifies need for "User Authentication" technical implementation
2. **References Functional Use Cases**: Links to functional authentication use cases
3. **Gathers Technical Inputs**: API endpoints, UI components, infrastructure requirements
4. **Selects Target**: Feature-level technical generation
5. **Provides Technical Context**: Authentication system technical architecture
6. **Chooses Location**: `features/benzaiten/user-management/authentication/`
7. **Generates Document**: `authentication-tech-use-cases.md`
8. **Validates Output**: Ensures appropriate number of technical use cases are generated as per the target - app/module/feature/enhancement, with proper traceability
9. **Updates Parent**: Links to module-level technical document

This mechanics framework ensures organized, consistent, and maintainable technical use case documentation across all levels of the application hierarchy, with proper traceability to functional requirements. 