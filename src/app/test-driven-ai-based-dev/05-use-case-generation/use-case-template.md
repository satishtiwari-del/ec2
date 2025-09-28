# Use Case Template

## Use Case Components

### Required Components

#### ID
**Purpose**: Unique identifier for the use case as a granular entity
**Guidelines**:
- Create a UUID when creating the use case
- Use format: `UC-[UUID]` (e.g., `UC-550e8400-e29b-41d4-a716-446655440000`)
- Ensure uniqueness across all use cases
- Include in all references and traceability

**Example**:
```
**ID**: UC-550e8400-e29b-41d4-a716-446655440000
```

#### Context
**Purpose**: Explains why this functionality is needed from a business perspective
**Guidelines**:
- Focus on business value and user needs
- Avoid technical implementation details
- Use domain-specific terminology
- Explain the problem being solved

**Example**:
```
**Context**: Secure application requiring robust user authentication with multiple verification methods
```

#### Actor
**Purpose**: Identifies who performs the action
**Guidelines**:
- Use role-based names (e.g., "End User", "System Administrator")
- Be specific about user type when relevant
- Consider user permissions and access levels
- Use consistent naming across related use cases

**Example**:
```
**Actor**: End User
```

#### Precondition
**Purpose**: Defines what must be true before this use case can be executed
**Guidelines**:
- Focus on business conditions, not technical states
- Be specific about required permissions or access
- Include any necessary data or system state
- Consider user prerequisites

**Example**:
```
**Precondition**: User has registered account with email and phone number
```

#### Main Flow
**Purpose**: Describes the step-by-step user actions and system responses
**Guidelines**:
- Number each step clearly
- Alternate between user actions and system responses
- Include specific data examples when helpful
- Focus on business logic, not technical implementation
- Keep steps atomic and clear

**Example**:
```
**Main Flow**:
1. User navigates to login page
2. User enters email: "user@company.com"
3. User enters password: "SecurePass123!"
4. System validates credentials
5. System generates one-time code and sends to user's phone
6. User receives SMS with 6-digit code: "123456"
7. User enters code in verification field
8. System validates code and creates session
9. System redirects to dashboard with success message
```

#### Postcondition
**Purpose**: Defines the business outcome achieved
**Guidelines**:
- Focus on business value delivered
- Be specific about what the user can now do
- Include any business state changes
- Avoid technical implementation details

**Example**:
```
**Postcondition**: User is authenticated and has access to authorized features
```

#### Alternative Flows
**Purpose**: Describes what happens when things go wrong or take different paths
**Guidelines**:
- Focus on business-focused alternatives
- Include validation failures and user cancellations
- Consider business rule violations
- Avoid technical error scenarios
- Use clear, descriptive names for alternatives

**Example**:
```
**Alternative Flows**:
- A1: Invalid credentials - system shows "Invalid email or password"
- A2: Code expires - system prompts for new code generation
- A3: Too many failed attempts - system locks account for 15 minutes
- A4: User selects "Remember Me" - system sets persistent session
```

### Optional Components

#### Business Rules
**Purpose**: Documents specific business constraints or requirements
**Guidelines**:
- Focus on domain-specific rules
- Include validation requirements
- Document approval workflows
- Specify business constraints

**Example**:
```
**Business Rules**:
- Password must be at least 8 characters with mixed case
- Account locks after 5 failed attempts
- Session expires after 30 minutes of inactivity
- One-time codes expire after 10 minutes
```

#### Data Requirements
**Purpose**: Specifies what data is needed or produced
**Guidelines**:
- Focus on business data, not technical storage
- Include required fields and formats
- Specify data validation rules
- Document data relationships

**Example**:
```
**Data Requirements**:
- User email (required, valid email format)
- Password (required, minimum 8 characters)
- One-time code (6 digits, expires in 10 minutes)
- Session token (generated on successful authentication)
```

#### Success Criteria
**Purpose**: Defines how success is measured
**Guidelines**:
- Focus on business outcomes
- Include measurable criteria
- Consider user experience goals
- Document quality requirements

**Example**:
```
**Success Criteria**:
- User can successfully authenticate within 2 minutes
- Failed attempts are properly tracked and limited
- Session management works correctly
- Audit trail is maintained for security events
```

## Template Structure

```
## [Feature Name]

### Use Case [Number]: [Specific Functionality]
**ID**: [UC-UUID]

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

[Optional Components]
**Business Rules**: [Domain-specific constraints]

**Data Requirements**: [Business data specifications]

**Success Criteria**: [Measurable outcomes]
```

## Quality Checklist

### Functional Focus
- [ ] Describes user goals and business value
- [ ] Uses business terminology
- [ ] Focuses on user interactions
- [ ] Defines business outcomes
- [ ] Avoids technical implementation details

### Completeness
- [ ] Covers main user journey
- [ ] Includes relevant alternative flows
- [ ] Defines clear preconditions
- [ ] Specifies business postconditions
- [ ] Addresses business rules

### Clarity
- [ ] Non-technical stakeholders can understand
- [ ] Business value is clear
- [ ] User actions are specific
- [ ] System responses are business-focused
- [ ] Outcomes are measurable

This template ensures consistent, business-focused use cases that provide clear guidance for AI-driven code generation while remaining accessible to all stakeholders.
