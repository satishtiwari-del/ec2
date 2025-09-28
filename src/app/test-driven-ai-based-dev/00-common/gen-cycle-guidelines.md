# Document Generation Guidelines

## Core Principles
* Use `doc-template.md` for all documents
* Replace placeholders (surrounded with `[]`) with actual information
* Remove template instruction sections present inside `*( )*`
* Document must have, minimum, all the sections given in `doc-template.md`
* Include User Inputs Summary at the top of the document for traceability

## Project Architecture to Follow
* Must refer to and follow [Project Structure Guideline](ng-ts-proj-structure-guidelines.md)

## AIGEN-Cycle Management
When starting a new TDAID generation cycle process:
* **FIRST**: Generate a 6-character UUID (format: `xxxx-xx`) for the generation cycle - "AIGEN-Cycle" (see detailed format requirements below in [this section](#-aigen-cycle-uuid-format-critical))
* Insert the AIGEN-Cycle UUID at the appropriate place given in the template
* In chat interactions, inform users about the AIGEN-Cycle and assist them in understanding how to use it for document lifecycle management
---

## AIGEN-Cycle Integration with Document Generation
### Document Generation Process
* Generate 6-character AIGEN-Cycle UUID (format: `xxxx-xx`) **before** starting any TDAID process cycle.
* Include UUID in document metadata sections as specified in `doc-template.md`
* Use UUID for tracking related documents across different phases and modules
* Reference UUID when linking to review processes or subsequent development phases
* For Pilot(user), extract user-id from `tdaid.json` in project's root folder.
* If `tdaid.json` or user-id is not mentioned in the file, ask user to enter their user-id.

### Cross-Document Consistency
* Apply AIGEN-Cycle principles to all document types (requirements, specifications, designs, etc.)
* Maintain UUID consistency across related documents in the same generation cycle
* Use UUID for bulk operations and process management across all document types

## User Inputs Summary Section
**MANDATORY**: Include a summary of all user-provided inputs at the top of every generated document:
```
## User Inputs Summary
**Scope**: [USER_SCOPE]
**Application**: [USER_APPLICATION]
**Module**: [USER_MODULE] (if applicable)
**Feature**: [USER_FEATURE] (if applicable)
**Enhancement**: [USER_ENHANCEMENT] (if applicable)
**Business Context**: [USER_BUSINESS_CONTEXT]
**Target Users**: [USER_TARGET_USERS]
**Business Value**: [USER_BUSINESS_VALUE]
**Output Location**: [USER_OUTPUT_LOCATION]
**AIGEN-Cycle UUID**: [GENERATED_UUID]
```

### Purpose of User Inputs Summary
* Provides document traceability and context
* Enables quick reference to original requirements
* Supports document lifecycle management
* Facilitates bulk operations using AIGEN-Cycle UUID
* Helps in review and validation processes

## AIGEN-Cycle Usage Examples
Users can leverage the AIGEN-Cycle UUID for various operations:
* **Bulk Operations**: "Remove all documents created in AIGEN-Cycle ID: [UUID]"
* **Process Continuation**: If interrupted during the "Review Step" (the next step after document generation), users can resume by saying "Restart review process for documents created in AIGEN-Cycle ID: [UUID]"
* **Document Tracking**: Use the UUID to track related documents across different phases of the development lifecycle
* **Version Control**: Maintain consistency when updating or modifying documents from the same generation cycle

## Best Practices
* Always include the AIGEN-Cycle UUID in the document metadata sections - 'DOCUMENT CREATION' & 'DOCUMENT UPDATE LOG'
* Use consistent formatting for UUIDs across all documents
* Document any deviations or customizations made during the generation process
* Maintain the update log with each modification to track document evolution. At the time of creation of the document, create 'DOCUMENT UPDATE LOG' section and leave it empty.

## 🚨 AIGEN-Cycle UUID Format (CRITICAL!)
- The AIGEN-Cycle UUID **must be exactly 7 characters, including the hyphen**.
- **Format:** `xxxx-xx` (4 alphanumeric characters, hyphen, 2 alphanumeric characters)
  - Examples: `A1B2-3C`, `Q7XK-2A`, `Z9XY-12`
- **Do NOT use descriptive or static values** (e.g., not `HAY-01` or `LOGIN-1`).
- The UUID should be **randomly generated** and unique for each document generation cycle.
- The same UUID must be used in all related documents for the same cycle.

> **Correct Examples:**  
> - `A1B2-3C`  
> - `Q7XK-2A`  
> - `Z9XY-12`
>
> **Incorrect Examples:**  
> - `HAY-01` (not random, not unique)  
> - `LOGIN-1` (not random, not unique)  
> - `ABC123` (missing hyphen, wrong length)

**Common Mistakes to Avoid**
- Using abbreviations, feature names, or static values as the UUID.
- Using more or fewer than 6 characters (including the hyphen).
- Omitting the hyphen or placing it in the wrong position.
- Not using a random/unique value for each generation cycle.

**Step-by-Step:**
1. **Before generating any document, create a random 6-character UUID in the format `xxxx-xx`.**
2. **Insert this UUID in all required metadata sections.**
3. **Use this UUID for all documents in the same generation cycle.**

| Step | What to Do | Example |
|------|------------|---------|
| 1 | Generate UUID | `Q7XK-2A` |
| 2 | Insert in User Inputs Summary | `**AIGEN-Cycle UUID**: Q7XK-2A` |
| 3 | Insert in DOCUMENT CREATION | `**AIGEN-Cycle UUID** | Q7XK-2A` |

---

