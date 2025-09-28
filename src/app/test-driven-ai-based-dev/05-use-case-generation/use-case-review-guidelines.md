# Use Case Review Guidelines for AI

## Overview
This document provides comprehensive guidelines for AI systems to review and validate generated use cases. These guidelines ensure that use cases meet quality standards and are suitable for code generation.

## Review Framework

### 1. Functional Focus Assessment

#### Business Value Evaluation
**Check**: Does the use case deliver clear business value?
- [ ] Business problem is clearly identified
- [ ] Solution provides measurable business benefit
- [ ] User goals are explicitly stated
- [ ] Business outcome is well-defined
- [ ] Value proposition is clear to stakeholders

#### User-Centric Approach
**Check**: Does the use case focus on user needs and interactions?
- [ ] User actions are clearly described
- [ ] System responses are business-focused
- [ ] User goals drive the flow
- [ ] User experience is prioritized
- [ ] User decisions and choices are included

#### Domain Language Usage
**Check**: Does the use case use appropriate business terminology?
- [ ] Technical jargon is avoided
- [ ] Business terminology is used consistently
- [ ] Domain-specific terms are appropriate
- [ ] Language is accessible to business stakeholders
- [ ] Terminology aligns with industry standards

### 2. Structure and Completeness Review

#### Required Components Validation
**Check**: Are all required components present and properly structured?

**Context**:
- [ ] Business need is clearly explained
- [ ] Problem statement is specific
- [ ] Scope is appropriately defined
- [ ] Business value is articulated

**Actor**:
- [ ] Actor is clearly identified
- [ ] Actor role is appropriate
- [ ] Actor permissions are specified
- [ ] Actor type is consistent

**Precondition**:
- [ ] Business conditions are specified
- [ ] Required permissions are listed
- [ ] System state is described
- [ ] Prerequisites are realistic

**Main Flow**:
- [ ] Steps are numbered sequentially
- [ ] User actions alternate with system responses
- [ ] Each step is atomic and clear
- [ ] Business logic is properly represented
- [ ] Data examples are provided where helpful

**Postcondition**:
- [ ] Business outcome is clearly stated
- [ ] Success criteria are measurable
- [ ] User capabilities are defined
- [ ] Business state changes are specified

**Alternative Flows**:
- [ ] Business-focused alternatives are included
- [ ] Error scenarios are covered
- [ ] User cancellation is handled
- [ ] Business rule violations are addressed

### 3. Content Quality Assessment

#### Business Logic Validation
**Check**: Is the business logic accurate and complete?
- [ ] Business rules are correctly represented
- [ ] Validation requirements are specified
- [ ] Approval workflows are properly defined
- [ ] Business constraints are included
- [ ] Decision points are clearly identified

#### Data Requirements Review
**Check**: Are data requirements properly specified?
- [ ] Required data fields are identified
- [ ] Data formats are specified
- [ ] Validation rules are included
- [ ] Data relationships are defined
- [ ] Business data is prioritized over technical storage

#### Process Flow Validation
**Check**: Is the process flow logical and complete?
- [ ] Flow follows business process
- [ ] Steps are in logical order
- [ ] Dependencies are properly handled
- [ ] Decision points are clear
- [ ] End-to-end process is covered

### 4. Technical Separation Review

#### Functional Focus Validation
**Check**: Does the use case avoid technical implementation details?
- [ ] No database references
- [ ] No API specifications
- [ ] No technology stack mentions
- [ ] No performance requirements
- [ ] No security implementation details
- [ ] No caching strategies
- [ ] No deployment considerations
- [ ] No error handling mechanisms

#### Business Abstraction Assessment
**Check**: Are technical concepts properly abstracted?
- [ ] "Saves data" instead of "saves to database"
- [ ] "Validates credentials" instead of "checks password hash"
- [ ] "Sends notification" instead of "calls email API"
- [ ] "Processes request" instead of "handles HTTP request"
- [ ] "Stores information" instead of "inserts into table"

### 5. Clarity and Accessibility Review

#### Stakeholder Accessibility
**Check**: Can non-technical stakeholders understand the use case?
- [ ] Business analysts can understand
- [ ] Product managers can review
- [ ] End users can relate to
- [ ] Domain experts can validate
- [ ] Requirements are clear

#### Language Quality Assessment
**Check**: Is the language clear and professional?
- [ ] Sentences are clear and concise
- [ ] Terminology is consistent
- [ ] Grammar and spelling are correct
- [ ] Tone is professional
- [ ] Ambiguity is minimized

### 6. Completeness and Coverage Review

#### User Journey Coverage
**Check**: Does the use case cover the complete user journey?
- [ ] All major steps are included
- [ ] Edge cases are considered
- [ ] Alternative paths are covered
- [ ] End-to-end process is complete
- [ ] User goals are fully addressed

#### Business Rule Coverage
**Check**: Are all relevant business rules included?
- [ ] Validation rules are specified
- [ ] Approval requirements are defined
- [ ] Business constraints are listed
- [ ] Policy requirements are included
- [ ] Compliance needs are addressed

#### Alternative Scenario Coverage
**Check**: Are alternative scenarios properly handled?
- [ ] Error conditions are covered
- [ ] User cancellations are handled
- [ ] Business rule violations are addressed
- [ ] System failures are considered
- [ ] Edge cases are included

### 7. Consistency and Standards Review

#### Naming Convention Compliance
**Check**: Do naming conventions follow standards?
- [ ] Actor names are consistent
- [ ] Feature names are standardized
- [ ] Terminology is uniform
- [ ] Abbreviations are explained
- [ ] Naming follows established patterns

#### Format Standardization
**Check**: Does the format follow established standards?
- [ ] Structure matches template
- [ ] Numbering is consistent
- [ ] Formatting is uniform
- [ ] Sections are properly organized
- [ ] Presentation is professional

### 8. Validation and Testing Review

#### Testability Assessment
**Check**: Can the use case be tested?
- [ ] Steps are testable
- [ ] Outcomes are measurable
- [ ] Preconditions are verifiable
- [ ] Postconditions are observable
- [ ] Alternative flows are testable

#### Traceability Validation
**Check**: Can requirements be traced?
- [ ] Business requirements are clear
- [ ] User stories can be derived
- [ ] Acceptance criteria are implied
- [ ] Test cases can be written
- [ ] Implementation can be planned

## Review Scoring System

### Scoring Criteria
- **Excellent (5/5)**: Meets all criteria, ready for implementation
- **Good (4/5)**: Minor issues, needs minimal revision
- **Acceptable (3/5)**: Some issues, needs moderate revision
- **Needs Work (2/5)**: Significant issues, needs major revision
- **Poor (1/5)**: Major issues, needs complete rewrite

### Review Categories
1. **Functional Focus** (25%): Business value and user-centric approach
2. **Structure and Completeness** (25%): Required components and coverage
3. **Content Quality** (20%): Business logic and data requirements
4. **Technical Separation** (15%): Avoidance of implementation details
5. **Clarity and Accessibility** (15%): Stakeholder understanding

## Review Output Format

### For Each Use Case, Provide:
1. **Overall Score**: Numerical rating (1-5)
2. **Category Scores**: Individual scores for each category
3. **Issues Found**: Specific problems identified
4. **Recommendations**: Suggested improvements
5. **Priority**: High/Medium/Low priority for fixes

### Example Review Output:
```
Use Case: User Authentication
Overall Score: 4/5

Category Scores:
- Functional Focus: 5/5
- Structure and Completeness: 4/5
- Content Quality: 4/5
- Technical Separation: 4/5
- Clarity and Accessibility: 4/5

Issues Found:
- Missing alternative flow for account lockout
- Precondition could be more specific
- Postcondition needs measurable criteria

Recommendations:
- Add alternative flow A5 for account lockout scenario
- Specify "User has valid email and phone number" in precondition
- Add "User can access authorized features within 2 minutes" to postcondition

Priority: Medium
```

## Automated Review Instructions

### For AI Systems:
1. **Apply all checklist items systematically**
2. **Score each category independently**
3. **Provide specific, actionable feedback**
4. **Prioritize issues by impact**
5. **Suggest concrete improvements**
6. **Maintain consistency across reviews**

### Review Process:
1. Read the use case completely
2. Apply each checklist category
3. Score each category (1-5)
4. Calculate overall score
5. Identify specific issues
6. Provide recommendations
7. Assign priority levels
8. Generate review output

This framework ensures comprehensive, consistent, and actionable reviews of generated use cases, leading to higher quality requirements for AI-driven code generation.
