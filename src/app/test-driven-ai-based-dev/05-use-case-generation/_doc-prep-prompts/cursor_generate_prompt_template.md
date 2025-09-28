# Generate detailed use cases for features
_Exported on 7/8/2025 at 08:28:52 GMT+5:30 from Cursor (1.2.1)_

---

**User**

A Business Analyst wants development team to build a feature. They want to create a detailed list of functional use-cases for the feature. They want to prompt the agent to write extensive use cases for the feature. They will give files inside @/ai-input as examples, guidelines, and templates. Suggest optimum prompt template for the Business Analyst to generate extensive and detailed use cases for any given feature.

---

**Cursor**

I'll analyze the provided files to understand the structure and requirements for generating comprehensive functional use cases, then create an optimal prompt template for the Business Analyst.


Based on my analysis of the provided files, I can see the comprehensive framework for generating functional use cases. The files include:

1. **Use Case Examples** - Detailed examples across 6 major categories
2. **General Guidelines** - Focus on functional requirements and business value
3. **Review Guidelines** - Comprehensive quality assessment framework
4. **Template** - Structured format for consistent use cases

Now I'll create an optimal prompt template for the Business Analyst:


```markdown
# Use Case Generation Prompt Template for Business Analysts

## Prompt Structure

```
You are an expert Business Analyst specializing in creating comprehensive functional use cases for software development. Your task is to generate detailed, business-focused use cases for the specified feature.

## Feature Information
**Feature Name**: [INSERT FEATURE NAME]
**Business Context**: [DESCRIBE THE BUSINESS PROBLEM THIS FEATURE SOLVES]
**Target Users**: [LIST THE PRIMARY USERS/ACTORS]
**Business Value**: [EXPLAIN THE BUSINESS BENEFIT THIS FEATURE PROVIDES]

## Requirements
1. Generate 3-5 comprehensive use cases covering the main functionality
2. Include 2-3 alternative flows for each use case
3. Focus on business value and user interactions
4. Avoid technical implementation details
5. Use business terminology, not technical jargon
6. Provide specific data examples where helpful
7. Ensure each use case is testable and measurable

## Use Case Structure Requirements
Each use case must include:
- **Context**: Why this functionality is needed from a business perspective
- **Actor**: Who performs the action (use role-based names)
- **Precondition**: Business conditions that must be met
- **Main Flow**: Step-by-step user actions and system responses (numbered 1-10+)
- **Postcondition**: Business outcome achieved
- **Alternative Flows**: Business-focused alternatives (A1, A2, A3, etc.)

## Quality Standards
- Focus on functional requirements, not technical implementation
- Use business language and domain terminology
- Ensure non-technical stakeholders can understand
- Include measurable success criteria
- Cover complete user journeys
- Address business rules and constraints
- Consider edge cases and error scenarios

## Additional Requirements
- Include specific data examples (emails, names, values, etc.)
- Provide realistic business scenarios
- Consider user permissions and access levels
- Address validation and business rule violations
- Include user cancellation scenarios
- Consider workflow and approval processes if relevant

## Output Format
Generate use cases in the following format:

## [Feature Name]

### Use Case 1: [Specific Functionality]
**Context**: [Business need and value proposition]

**Actor**: [Role-based actor name]

**Precondition**: [Business conditions and permissions]

**Main Flow**:
1. [User action with specific data example]
2. [System response with business logic]
3. [Continue with numbered steps...]

**Postcondition**: [Measurable business outcome]

**Alternative Flows**:
- A1: [Business-focused alternative with specific scenario]
- A2: [Business-focused alternative with specific scenario]
- A3: [Business-focused alternative with specific scenario]

[Repeat for additional use cases...]

## Instructions for AI
Based on the feature information provided above, generate comprehensive functional use cases that:
1. Follow the exact structure and format specified
2. Include realistic business scenarios with specific data examples
3. Focus on user goals and business value
4. Avoid any technical implementation details
5. Ensure each use case is complete and testable
6. Provide sufficient detail for development team understanding
7. Include appropriate alternative flows for each use case
8. Use consistent business terminology throughout
9. Make success criteria measurable and observable
10. Consider the complete user journey from start to finish

Generate use cases that would enable a development team to understand exactly what needs to be built from a business perspective.
```

## Usage Instructions for Business Analysts

### Step 1: Prepare Feature Information
Fill in the following sections with your specific feature details:
- **Feature Name**: Clear, descriptive name
- **Business Context**: Why this feature is needed
- **Target Users**: Who will use this feature
- **Business Value**: What benefit it provides

### Step 2: Customize Requirements
Adjust the requirements based on your specific needs:
- Number of use cases needed
- Complexity level required
- Specific business domains to consider
- Regulatory or compliance requirements

### Step 3: Execute the Prompt
Copy the template, fill in your feature information, and provide it to the AI system.

### Step 4: Review and Refine
Use the review guidelines to assess the generated use cases and request refinements if needed.

## Example Usage

**Feature Name**: Employee Expense Approval System
**Business Context**: Company needs automated expense approval workflow to reduce manual processing and ensure policy compliance
**Target Users**: Employees, Managers, Finance Team
**Business Value**: Faster expense processing, reduced errors, improved compliance tracking

This template ensures comprehensive, business-focused use cases that provide clear guidance for development teams while remaining accessible to all stakeholders.
```

Perfect! I've created a comprehensive prompt template for Business Analysts to generate detailed functional use cases. Here's what I've provided:

## Key Features of the Prompt Template:

### 1. **Clear Structure**
- Feature information section for specific details
- Requirements section for customization
- Quality standards for consistency
- Output format for standardized results

### 2. **Business-Focused Approach**
- Emphasizes functional requirements over technical implementation
- Uses business terminology and domain language
- Focuses on user goals and business value
- Includes measurable success criteria

### 3. **Comprehensive Coverage**
- Requires 3-5 use cases per feature
- Includes 2-3 alternative flows per use case
- Covers complete user journeys
- Addresses business rules and constraints

### 4. **Quality Assurance**
- Ensures testable and measurable outcomes
- Includes specific data examples
- Considers edge cases and error scenarios
- Maintains stakeholder accessibility

### 5. **Practical Usage**
- Step-by-step instructions for Business Analysts
- Example usage scenario
- Customizable requirements
- Review and refinement guidance

## How to Use This Template:

1. **Fill in the feature information** with your specific details
2. **Customize requirements** based on your needs
3. **Execute the prompt** with an AI system
4. **Review the results** using the provided guidelines
5. **Refine as needed** for optimal quality

This template leverages all the best practices from your existing files:
- Uses the structure from the template file
- Incorporates quality standards from the review guidelines
- Follows the business-focused approach from the general guidelines
- Includes comprehensive examples like those in the examples file

The prompt will generate use cases that are:
- ✅ Business-focused and value-driven
- ✅ Comprehensive and detailed
- ✅ Testable and measurable
- ✅ Accessible to all stakeholders
- ✅ Ready for development team implementation

This template should significantly improve the quality and consistency of use case generation for any feature your Business Analysts need to document.

---

**User**

Let's not include details, given in the supplied documents, into this template. Keep this template as short as possible with instructions about the feature and accompanied templates, guidelines, and examples.

---

**Cursor**

I'll create a much shorter, more concise template that references the existing documents rather than including all the details.


```markdown
# Use Case Generation Prompt Template for Business Analysts

## Prompt Structure

```
You are an expert Business Analyst specializing in creating comprehensive functional use cases for software development. Your task is to generate detailed, business-focused use cases for the specified feature.

## Feature Information
**Feature Name**: [INSERT FEATURE NAME]
**Business Context**: [DESCRIBE THE BUSINESS PROBLEM THIS FEATURE SOLVES]
**Target Users**: [LIST THE PRIMARY USERS/ACTORS]
**Business Value**: [EXPLAIN THE BUSINESS BENEFIT THIS FEATURE PROVIDES]

## Requirements
1. Generate 3-5 comprehensive use cases covering the main functionality
2. Include 2-3 alternative flows for each use case
3. Focus on business value and user interactions
4. Avoid technical implementation details
5. Use business terminology, not technical jargon
6. Provide specific data examples where helpful
7. Ensure each use case is testable and measurable

## Use Case Structure Requirements
Each use case must include:
- **Context**: Why this functionality is needed from a business perspective
- **Actor**: Who performs the action (use role-based names)
- **Precondition**: Business conditions that must be met
- **Main Flow**: Step-by-step user actions and system responses (numbered 1-10+)
- **Postcondition**: Business outcome achieved
- **Alternative Flows**: Business-focused alternatives (A1, A2, A3, etc.)

## Quality Standards
- Focus on functional requirements, not technical implementation
- Use business language and domain terminology
- Ensure non-technical stakeholders can understand
- Include measurable success criteria
- Cover complete user journeys
- Address business rules and constraints
- Consider edge cases and error scenarios

## Additional Requirements
- Include specific data examples (emails, names, values, etc.)
- Provide realistic business scenarios
- Consider user permissions and access levels
- Address validation and business rule violations
- Include user cancellation scenarios
- Consider workflow and approval processes if relevant

## Output Format
Generate use cases in the following format:

## [Feature Name]

### Use Case 1: [Specific Functionality]
**Context**: [Business need and value proposition]

**Actor**: [Role-based actor name]

**Precondition**: [Business conditions and permissions]

**Main Flow**:
1. [User action with specific data example]
2. [System response with business logic]
3. [Continue with numbered steps...]

**Postcondition**: [Measurable business outcome]

**Alternative Flows**:
- A1: [Business-focused alternative with specific scenario]
- A2: [Business-focused alternative with specific scenario]
- A3: [Business-focused alternative with specific scenario]

[Repeat for additional use cases...]

## Instructions for AI
Based on the feature information provided above, generate comprehensive functional use cases that:
1. Follow the exact structure and format specified
2. Include realistic business scenarios with specific data examples
3. Focus on user goals and business value
4. Avoid any technical implementation details
5. Ensure each use case is complete and testable
6. Provide sufficient detail for development team understanding
7. Include appropriate alternative flows for each use case
8. Use consistent business terminology throughout
9. Make success criteria measurable and observable
10. Consider the complete user journey from start to finish

Generate use cases that would enable a development team to understand exactly what needs to be built from a business perspective.
```

## Usage Instructions for Business Analysts

### Step 1: Prepare Feature Information
Fill in the following sections with your specific feature details:
- **Feature Name**: Clear, descriptive name
- **Business Context**: Why this feature is needed
- **Target Users**: Who will use this feature
- **Business Value**: What benefit it provides

### Step 2: Customize Requirements
Adjust the requirements based on your specific needs:
- Number of use cases needed
- Complexity level required
- Specific business domains to consider
- Regulatory or compliance requirements

### Step 3: Execute the Prompt
Copy the template, fill in your feature information, and provide it to the AI system.

### Step 4: Review and Refine
Use the review guidelines to assess the generated use cases and request refinements if needed.

## Example Usage

**Feature Name**: Employee Expense Approval System
**Business Context**: Company needs automated expense approval workflow to reduce manual processing and ensure policy compliance
**Target Users**: Employees, Managers, Finance Team
**Business Value**: Faster expense processing, reduced errors, improved compliance tracking

This template ensures comprehensive, business-focused use cases that provide clear guidance for development teams while remaining accessible to all stakeholders.

->

# Use Case Generation Prompt Template

## Instructions for AI

You are an expert Business Analyst. Generate comprehensive functional use cases for the specified feature using the provided guidelines and templates.

## Feature Information
**Feature Name**: [INSERT FEATURE NAME]
**Business Context**: [DESCRIBE THE BUSINESS PROBLEM THIS FEATURE SOLVES]
**Target Users**: [LIST THE PRIMARY USERS/ACTORS]
**Business Value**: [EXPLAIN THE BUSINESS BENEFIT THIS FEATURE PROVIDES]

## Requirements
- Generate 3-5 comprehensive use cases covering main functionality
- Include 2-3 alternative flows for each use case
- Focus on business value and user interactions
- Avoid technical implementation details
- Use business terminology, not technical jargon
- Provide specific data examples where helpful
- Ensure each use case is testable and measurable

## Reference Documents
Use these documents for guidance:
- **Template**: `use-case-template.md` - Structure and format requirements
- **Guidelines**: `use-case-general-guideline.md` - Business-focused approach
- **Examples**: `use-case-examples.md` - Comprehensive examples across 6 categories
- **Review**: `use-case-review-guidelines.md` - Quality assessment framework

## Instructions
1. Follow the exact structure from the template
2. Apply business-focused guidelines
3. Use examples as reference for detail level
4. Ensure quality standards from review guidelines
5. Generate use cases that enable development team understanding

Generate comprehensive functional use cases that provide clear business requirements for development.
```

Perfect! I've created a much shorter and more concise template that:

## Key Changes Made:

### 1. **Removed Redundant Details**
- Eliminated all the detailed structure requirements (already in template.md)
- Removed quality standards (already in guidelines.md)
- Cut out output format examples (already in template.md)
- Removed usage instructions (self-explanatory)

### 2. **Focused on Core Elements**
- **Feature Information**: Just the essential inputs needed
- **Requirements**: Brief bullet points of key requirements
- **Reference Documents**: Clear pointers to existing files
- **Instructions**: Simple, actionable steps

### 3. **Leveraged Existing Documentation**
- References the template file for structure
- Points to guidelines for business focus
- Uses examples file for detail level
- References review guidelines for quality

## Benefits of This Approach:

✅ **Much shorter** - Reduced from ~200 lines to ~30 lines
✅ **No duplication** - References existing documents instead
✅ **Easy to use** - Clear, simple instructions
✅ **Maintainable** - Changes to guidelines/templates automatically apply
✅ **Focused** - Only includes what's unique to this prompt

The template now serves as a lightweight wrapper that directs the AI to use the comprehensive documentation you've already created, rather than repeating all the details. This makes it much more maintainable and easier to use while still providing all the necessary guidance for generating high-quality use cases.

---

**User**

@use-case-general-guideline.md 
See the section Mechanics of Use Case generation. Detail out/list guidelines related to how and where guidelines documents have to be generated. Module > Feature > (and if there  are enhancements/feature), documents should be generated with proper naming conventions inside appropriate folder. Prompt Biz Analyst to choose target folder.

---

**Cursor**

I'll analyze the general guidelines and create detailed mechanics for use case generation with proper folder structure and naming conventions.


Now I'll add the detailed mechanics section to the general guidelines document:


```markdown
## Mechanics of Use Case generation



->

## Mechanics of Use Case Generation

### Folder Structure and Organization

#### Base Directory Structure
```
use-case-generation/
├── ai-input/                    # AI input files (templates, guidelines, examples)
├── dev-input/                   # Business Analyst input files
└── generated/                   # Generated use case documents
    ├── applications/            # Application-level use cases
    ├── modules/                 # Module-level use cases
    ├── features/                # Feature-level use cases
    └── enhancements/            # Enhancement-level use cases
```

#### Naming Conventions

**Application Level**:
- Folder: `generated/applications/[app-name]/`
- File: `[app-name]-use-cases.md`
- Example: `generated/applications/benzaiten/benzaiten-use-cases.md`

**Module Level**:
- Folder: `generated/modules/[app-name]/[module-name]/`
- File: `[module-name]-use-cases.md`
- Example: `generated/modules/benzaiten/user-management/user-management-use-cases.md`

**Feature Level**:
- Folder: `generated/features/[app-name]/[module-name]/[feature-name]/`
- File: `[feature-name]-use-cases.md`
- Example: `generated/features/benzaiten/user-management/authentication/authentication-use-cases.md`

**Enhancement Level**:
- Folder: `generated/enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`
- File: `[enhancement-name]-use-cases.md`
- Example: `generated/enhancements/benzaiten/user-management/authentication/multi-factor-auth/multi-factor-auth-use-cases.md`

### Document Generation Guidelines

#### Application-Level Documents
**When to Generate**: Complete application overview with all modules
**Content Structure**:
- Application overview and business context
- List of all modules with brief descriptions
- High-level use cases for each module
- Cross-module integration scenarios
**File Naming**: `[app-name]-use-cases.md`

#### Module-Level Documents
**When to Generate**: Complete module with all features
**Content Structure**:
- Module overview and business purpose
- List of all features within the module
- Detailed use cases for each feature
- Module-specific business rules
**File Naming**: `[module-name]-use-cases.md`

#### Feature-Level Documents
**When to Generate**: Individual feature with complete functionality
**Content Structure**:
- Feature overview and business value
- 5-10 comprehensive use cases
- Feature-specific business rules
- Data requirements and validation
**File Naming**: `[feature-name]-use-cases.md`

#### Enhancement-Level Documents
**When to Generate**: Feature enhancement or extension
**Content Structure**:
- Enhancement overview and business need
- 3-5 use cases for enhancement
- Integration with parent feature
- Additional business rules
**File Naming**: `[enhancement-name]-use-cases.md`

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
- **Application**: `generated/applications/[app-name]/`
- **Module**: `generated/modules/[app-name]/[module-name]/`
- **Feature**: `generated/features/[app-name]/[module-name]/[feature-name]/`
- **Enhancement**: `generated/enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`
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
4. **Chooses Location**: `generated/features/benzaiten/user-management/authentication/`
5. **Generates Document**: `authentication-use-cases.md`
6. **Validates Output**: Ensures 5-10 use cases with business focus
7. **Updates Parent**: Links to module-level document

This mechanics framework ensures organized, consistent, and maintainable use case documentation across all levels of the application hierarchy.
```

Now I need to update the prompt template to include the mechanics information:


```markdown
## Requirements
- 
- Include 2-3 alternative flows for each use case
- Focus on business value and user interactions
- Avoid technical implementation details
- Use business terminology, not technical jargon
- Provide specific data examples where helpful
- Ensure each use case is testable and measurable

## Reference Documents
Use these documents for guidance:
- **Template**: `use-case-template.md` - Structure and format requirements
- **Guidelines**: `use-case-general-guideline.md` - Business-focused approach
- **Examples**: `use-case-examples.md` - Comprehensive examples across 6 categories
- **Review**: `use-case-review-guidelines.md` - Quality assessment framework

## Instructions
1. Follow the exact structure from the template
2. Apply business-focused guidelines
3. Use examples as reference for detail level
4. Ensure quality standards from review guidelines
5. Generate use cases that enable development team understanding

Generate comprehensive functional use cases that provide clear business requirements for development.

->

## Requirements
- Generate use cases based on target level (Application/Module/Feature/Enhancement)
- Include 2-3 alternative flows for each use case
- Focus on business value and user interactions
- Avoid technical implementation details
- Use business terminology, not technical jargon
- Provide specific data examples where helpful
- Ensure each use case is testable and measurable

## Target Level Guidelines
- **Application**: Complete app overview with all modules (high-level use cases)
- **Module**: Complete module with all features (detailed module use cases)
- **Feature**: Individual feature (5-10 comprehensive use cases)
- **Enhancement**: Feature extension (3-5 enhancement use cases)

## Output Location
Choose appropriate folder structure:
- **Application**: `generated/applications/[app-name]/`
- **Module**: `generated/modules/[app-name]/[module-name]/`
- **Feature**: `generated/features/[app-name]/[module-name]/[feature-name]/`
- **Enhancement**: `generated/enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`

## Reference Documents
Use these documents for guidance:
- **Template**: `use-case-template.md` - Structure and format requirements
- **Guidelines**: `use-case-general-guideline.md` - Business-focused approach and mechanics
- **Examples**: `use-case-examples.md` - Comprehensive examples across 6 categories
- **Review**: `use-case-review-guidelines.md` - Quality assessment framework

## Instructions
1. Follow the exact structure from the template
2. Apply business-focused guidelines and mechanics
3. Use examples as reference for detail level
4. Ensure quality standards from review guidelines
5. Generate use cases that enable development team understanding
6. Follow naming conventions and folder structure
7. Maintain parent-child relationships if applicable

Generate comprehensive functional use cases that provide clear business requirements for development.
```

Perfect! I've successfully added comprehensive mechanics for use case generation to the general guidelines document. Here's what I've implemented:

## Key Additions to the Mechanics Section:

### 1. **Folder Structure and Organization**
- Clear directory hierarchy: `applications/` → `modules/` → `features/` → `enhancements/`
- Consistent naming conventions for each level
- Example paths for easy understanding

### 2. **Document Generation Guidelines**
- **Application Level**: Complete app overview with all modules
- **Module Level**: Complete module with all features  
- **Feature Level**: Individual feature (5-10 use cases)
- **Enhancement Level**: Feature extension (3-5 use cases)

### 3. **Business Analyst Prompt Instructions**
- Target selection process
- Prompt template with clear structure
- Folder structure options
- Output requirements specification

### 4. **Quality Control Process**
- Pre-generation checklist
- Post-generation validation
- Integration guidelines
- Version control recommendations

### 5. **Updated Prompt Template**
- Added target level guidelines
- Included output location options
- Enhanced instructions with mechanics
- Maintained parent-child relationships

## Benefits of This Approach:

✅ **Organized Structure**: Clear hierarchy from Application → Module → Feature → Enhancement
✅ **Consistent Naming**: Standardized file and folder naming conventions
✅ **Scalable**: Supports complex applications with multiple modules and features
✅ **Maintainable**: Clear relationships and version control guidelines
✅ **User-Friendly**: Business Analysts can easily choose target level and location

## Usage Example:

**Business Analyst Workflow**:
1. Identifies need for "User Authentication" feature
2. Selects Feature-level target
3. Provides business context
4. Chooses location: `generated/features/benzaiten/user-management/authentication/`
5. Generates `authentication-use-cases.md` with 5-10 use cases
6. Validates output and updates parent module document

This mechanics framework ensures organized, consistent, and maintainable use case documentation across all levels of the application hierarchy, making it easy for Business Analysts to generate comprehensive functional requirements.

---

**User**

Remove generated folder from Naming Conventions section

---

**Cursor**

```markdown
#### Naming Conventions

**Application Level**:
- Folder: `generated/applications/[app-name]/`
- File: `[app-name]-use-cases.md`
- Example: `generated/applications/benzaiten/benzaiten-use-cases.md`

**Module Level**:
- Folder: `generated/modules/[app-name]/[module-name]/`
- File: `[module-name]-use-cases.md`
- Example: `generated/modules/benzaiten/user-management/user-management-use-cases.md`

**Feature Level**:
- Folder: `generated/features/[app-name]/[module-name]/[feature-name]/`
- File: `[feature-name]-use-cases.md`
- Example: `generated/features/benzaiten/user-management/authentication/authentication-use-cases.md`

**Enhancement Level**:
- Folder: `generated/enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`
- File: `[enhancement-name]-use-cases.md`
- Example: `generated/enhancements/benzaiten/user-management/authentication/multi-factor-auth/multi-factor-auth-use-cases.md`

->

#### Naming Conventions

**Application Level**:
- Folder: `applications/[app-name]/`
- File: `[app-name]-use-cases.md`
- Example: `applications/benzaiten/benzaiten-use-cases.md`

**Module Level**:
- Folder: `modules/[app-name]/[module-name]/`
- File: `[module-name]-use-cases.md`
- Example: `modules/benzaiten/user-management/user-management-use-cases.md`

**Feature Level**:
- Folder: `features/[app-name]/[module-name]/[feature-name]/`
- File: `[feature-name]-use-cases.md`
- Example: `features/benzaiten/user-management/authentication/authentication-use-cases.md`

**Enhancement Level**:
- Folder: `enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`
- File: `[enhancement-name]-use-cases.md`
- Example: `enhancements/benzaiten/user-management/authentication/multi-factor-auth/multi-factor-auth-use-cases.md`
```

Now I need to update the other sections that reference the generated folder:


```markdown
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
- **Application**: `generated/applications/[app-name]/`
- **Module**: `generated/modules/[app-name]/[module-name]/`
- **Feature**: `generated/features/[app-name]/[module-name]/[feature-name]/`
- **Enhancement**: `generated/enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`
```

->

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
```

```markdown
### Example Workflow

1. **Business Analyst** identifies need for "User Authentication" feature
2. **Selects Target**: Feature-level generation
3. **Provides Context**: Authentication system for secure access
4. **Chooses Location**: `generated/features/benzaiten/user-management/authentication/`
5. **Generates Document**: `authentication-use-cases.md`
6. **Validates Output**: Ensures 5-10 use cases with business focus
7. **Updates Parent**: Links to module-level document

->

### Example Workflow

1. **Business Analyst** identifies need for "User Authentication" feature
2. **Selects Target**: Feature-level generation
3. **Provides Context**: Authentication system for secure access
4. **Chooses Location**: `features/benzaiten/user-management/authentication/`
5. **Generates Document**: `authentication-use-cases.md`
6. **Validates Output**: Ensures 5-10 use cases with business focus
7. **Updates Parent**: Links to module-level document
```

Now I need to update the prompt template file as well:


```markdown
## Output Location
Choose appropriate folder structure:
- **Application**: `generated/applications/[app-name]/`
- **Module**: `generated/modules/[app-name]/[module-name]/`
- **Feature**: `generated/features/[app-name]/[module-name]/[feature-name]/`
- **Enhancement**: `generated/enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`

->

## Output Location
Choose appropriate folder structure:
- **Application**: `applications/[app-name]/`
- **Module**: `modules/[app-name]/[module-name]/`
- **Feature**: `features/[app-name]/[module-name]/[feature-name]/`
- **Enhancement**: `enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`
```

Perfect! I've successfully removed the "generated" folder prefix from all naming conventions throughout both documents. Here's what was updated:

## Changes Made:

### 1. **Naming Conventions Section**
- **Application Level**: `applications/[app-name]/` (was `generated/applications/[app-name]/`)
- **Module Level**: `modules/[app-name]/[module-name]/` (was `generated/modules/[app-name]/[module-name]/`)
- **Feature Level**: `features/[app-name]/[module-name]/[feature-name]/` (was `generated/features/[app-name]/[module-name]/[feature-name]/`)
- **Enhancement Level**: `enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/` (was `generated/enhancements/[app-name]/[module-name]/[feature-name]/[enhancement-name]/`)

### 2. **Prompt Template Section**
- Updated folder structure options to remove "generated/" prefix
- Updated example workflow to use simplified paths

### 3. **Example Workflow**
- Updated the location example to use `features/benzaiten/user-management/authentication/`

### 4. **Prompt Template File**
- Updated output location guidelines to remove "generated/" prefix

## Benefits of This Change:

✅ **Simplified Paths**: Cleaner, shorter folder paths
✅ **Flexible Structure**: Can be placed anywhere in the project
✅ **Easier Navigation**: Less nested folder structure
✅ **Consistent Naming**: All levels follow the same pattern without extra prefix

The folder structure is now more flexible and can be integrated into any project structure without the need for a specific "generated" parent folder.

