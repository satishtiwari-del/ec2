# Functional Use Case General Guidelines

## Overview
This document provides guidelines for creating functional use cases that focus purely on business requirements and user interactions, without technical implementation details.

## Analyse Target for Use Cases with following guidelines
- **Application**: Along with app details, must receive the core modules/features of the app. Review modules/features and suggest enhancements, additions, and changes for extensive coverage of use cases.  
- **Module**: Along with module details, must receive the App to which feature belongs. If app is not supplied, prompt/suggest, maybe this repo is application repo and it is understood as given. Module details should have as many features listed to make the module complete. Review and if some important feature is missing, suggest and get consent. As simple module should have 2-5 features and desired use cases (see feature section) in each feature, whereas a complex module may have 5-10+ features and required number of use cases in each feature.  
- **Feature**: Along with feature detail, must receive the module to which feature belongs. If module is not supplied, prompt. Minimum 5-10 use cases be generated to cover the entire feature properly. If required add more.  
- **Enahancements**: Along with Enhancement detail, must receive the feature to which enhancement belongs. If feature is not supplied, prompt. Minimun 3-5 uses cases be generated to cover the entire enhancement properly. If required add more than 5 use cases.  

## Mechanics of Use Case Generation

### Folder Structure and Organization

#### Naming Conventions

**Application Level**:
- Folder: `[app-name]/`
- File: `[app-name]-use-cases.md`
- Example: `benzaiten/benzaiten-use-cases.md`

**Module Level**:
- Folder: `[app-name]/[module-name]/`
- File: `[app-name]-[module-name]-use-cases.md`
- Example: `benzaiten/user-management/benzaiten-user-management-use-cases.md`

**Feature Level**:
- Folder: `[app-name]/[module-name]/[feature-name]/`
- File: `[app-name]-[module-name]-[feature-name]-use-cases.md`
- Example: `benzaiten/user-management/authentication/benzaiten-user-management-authentication-use-cases.md`

**Enhancement Level**:
- Folder: `[app-name]/[module-name]/[feature-name]/[enhancement-name]/`
- File: `[app-name]-[module-name]-[feature-name]-[enhancement-name]-use-cases.md`
- Example: `benzaiten/user-management/authentication/multi-factor-auth/benzaiten-user-management-auth-multi-factor-auth-use-cases.md`

### Document Generation Guidelines

#### Application-Level Documents
**When to Generate**: Complete application overview with all modules
**Content Structure**:
- Application overview and business context
- List of all modules with brief descriptions
- High-level use cases for each module
- Cross-module integration scenarios
- link to module level use-case files

#### Module-Level Documents
**When to Generate**: Complete module with all features
**Content Structure**:
- Module overview and business purpose
- List of all features within the module
- List of each feature
- Link to feature level use case file
- Module-specific business rules
- Cross-feature integration scenarios

#### Feature-Level Documents
**When to Generate**: Individual feature with complete functionality
**Content Structure**:
- Feature overview and business value
- 5-10 comprehensive use cases
- Feature-specific business rules
- Data requirements and validation

#### Enhancement-Level Documents
**When to Generate**: Feature enhancement or extension
**Content Structure**:
- Enhancement overview and business need
- 3-5 use cases for enhancement
- Integration with parent feature
- Additional business rules

#### Example of Document File Locations
** !!!Important!!! **
```
My Application One
    |
    |
My Application Two

```


### Business Analyst Prompt Instructions

#### Target Selection Process
1. **Identify Target Level**: Application, Module, Feature, or Enhancement
2. **Provide Context**: Business context and scope
3. **Specify Requirements**: Number of use cases needed
4. **Choose Output Location**: Select appropriate folder structure

#### Prompt Template for Business Analysts
```
## Target Information
**Target Type**: [Application/Module/Feature/Enhancement]
**Target Name**: [Name of target]
**Parent Context**: [Parent module/feature if applicable]
**Business Context**: [Why this target is needed]
**Scope**: [What should be covered]

## Output Requirements
**Number of Use Cases**: [Specify minimum and desired count]
**Output Location**: [Choose from available folder structure]
**Special Requirements**: [Any specific business rules or constraints]

## Folder Structure Options
- **Application**: `applications/[app-name]/`
- **Module**: `modules/[app-name]/[module-name]/`
- **Feature**: `features/[app-name]/[module-name]/[feature-name]/`
- **Enhancement**: `enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`
```

### Quality Control Process

#### Pre-Generation Checklist
- [ ] Target level is clearly identified
- [ ] Business context is well-defined
- [ ] Parent relationships are specified
- [ ] Output location is selected
- [ ] Naming conventions are followed

#### Post-Generation Validation
- [ ] Document follows template structure
- [ ] Use cases meet minimum count requirements
- [ ] Business focus is maintained
- [ ] Technical details are avoided
- [ ] File is saved in correct location

### Integration Guidelines

#### Cross-Reference Management
- Link related documents using relative paths
- Maintain parent-child relationships
- Update parent documents when children are added
- Ensure consistency across related documents

#### Version Control
- Use descriptive commit messages
- Tag major versions
- Maintain change logs
- Track document relationships

### Example Workflow

1. **Business Analyst** identifies need for "User Authentication" feature
2. **Selects Target**: Feature-level generation
3. **Provides Context**: Authentication system for secure access
4. **Chooses Location**: `features/benzaiten/user-management/authentication/`
5. **Generates Document**: `authentication-use-cases.md`
6. **Validates Output**: Ensures 5-10 use cases with business focus
7. **Updates Parent**: Links to module-level document

This mechanics framework ensures organized, consistent, and maintainable use case documentation across all levels of the application hierarchy.


## Core Principles

### 1. Focus on Functional Requirements
- **Business Value**: Every use case should deliver clear business value
- **User-Centric**: Describe what users want to accomplish, not how to implement it
- **Domain Language**: Use business terminology, not technical jargon
- **Clear Outcomes**: Define what success looks like from a business perspective

### 2. Structure Guidelines

#### What to Include
- User actions and decisions
- System responses and validations
- Business rules and constraints
- Data that users provide or receive
- Business outcomes and notifications

#### What to Exclude
- Technical implementation details
- Database schemas or queries
- API specifications
- Technology choices
- Performance requirements
- Security implementation details
- Error handling mechanisms
- Caching strategies
- Deployment considerations

### 3. Writing Style Guidelines

#### Use Business Language
- ✅ "User submits expense report for approval"
- ❌ "User clicks submit button which triggers API call to backend"

#### Focus on User Goals
- ✅ "User wants to track project progress"
- ❌ "System displays progress bar component"

#### Describe Business Rules
- ✅ "Approval requires manager signature"
- ❌ "System validates user permissions using JWT tokens"

#### Define Business Outcomes
- ✅ "Order is confirmed and customer receives confirmation"
- ❌ "Order status is updated in database and email is sent"

### 4. Examples of Good vs Bad Use Cases

#### Good Example
```
**Use Case**: User Registration
**Context**: New users need to create accounts to access the system
**Actor**: Prospective User
**Precondition**: User has valid email address
**Main Flow**:
1. User navigates to registration page
2. User enters email address
3. User creates password
4. User provides name and contact information
5. User accepts terms and conditions
6. System validates information
7. System creates user account
8. System sends welcome email
**Postcondition**: User can log in and access system features
```

#### Bad Example (Too Technical)
```
**Use Case**: User Registration
**Context**: System needs to create user records in database
**Actor**: Prospective User
**Precondition**: Database connection is available
**Main Flow**:
1. User submits form data
2. System validates input using regex patterns
3. System hashes password with bcrypt
4. System inserts record into users table
5. System generates JWT token
6. System sends email via SMTP
**Postcondition**: User record exists in database
```

### 5. Alternative Flows Guidelines

#### Business-Focused Alternatives
- User provides invalid information
- User cancels the process
- System detects duplicate information
- User doesn't have required permissions
- Business rules prevent the action

#### Avoid Technical Alternatives
- Database connection fails
- API timeout occurs
- Memory allocation fails
- Network connectivity issues
- Server crashes

### 6. Validation Guidelines

#### Ask These Questions
- Does this describe what the user wants to accomplish?
- Is the business value clear?
- Can a non-technical person understand this?
- Does it focus on user interactions and business outcomes?
- Would this help a business analyst understand the requirement?

#### Red Flags to Remove
- Technical implementation details
- Database or API specifications
- Performance or scalability concerns
- Security implementation details
- Technology stack references
- Error handling mechanisms
- Caching or optimization strategies

### 7. Collaboration Guidelines

#### With Business Stakeholders
- Use cases should be understandable by business users
- Focus on business processes and workflows
- Use domain-specific terminology
- Validate business rules and requirements

#### With Development Team
- Technical requirements will be derived from functional use cases
- Implementation details will be specified in technical use cases
- Performance and security requirements will be addressed separately
- Technology choices will be made based on functional requirements

### 8. Template for Functional Use Cases

```
## [Feature Name]

### Use Case [Number]: [Specific Functionality]
**Context**: [Why is this needed from a business perspective?]

**Actor**: [Who performs this action?]

**Precondition**: [What business conditions must be met?]

**Main Flow**:
1. [User action or system response]
2. [User action or system response]
3. [Continue with business-focused steps]

**Postcondition**: [What business outcome is achieved?]

**Alternative Flows**:
- A1: [Business-focused alternative]
- A2: [Business-focused alternative]
- A3: [Business-focused alternative]
```

This guideline ensures that use cases remain focused on functional requirements and business value, making them accessible to all stakeholders while providing a solid foundation for technical implementation.
