# Use Case Reviewer

## Overview
This document defines the review process for functional use cases from multiple stakeholder perspectives to ensure comprehensive validation and quality assurance.

## Input Files for Review Process
**System Note:** The system will receive references to all functional test-case file names that are to be reviewed. The system should display the names of all target files for this review session.

**[UX Instructions for the System]**
- Present the list of files to be reviewed
- Ask user to proceed with the files received
- Provide two clear options in chat interface:
  - "Abort" (to cancel the review session)
  - "Proceed" (to continue with the review)

## Review Process Workflow

### Step 1: Document Format Review
**System Note:** Before proceeding with perspective-based reviews, conduct a comprehensive document format review against `gen-cycle-guidelines.md` to ensure all documents meet the required standards and formatting requirements.

**[UX Instructions for the System]**
- Inform user: "Starting document format review against gen-cycle-guidelines.md..."
- Conduct systematic review of each document for:
  - Template compliance
  - Required sections presence
  - Placeholder replacement validation
  - AIGEN-Cycle UUID validation (CRITICAL)
  - User Inputs Summary completeness
  - Document metadata sections

#### AIGEN-Cycle UUID Validation (CRITICAL)
**System Note:** All AIGEN-Cycle UUID validation requirements are centrally defined.

> **REFERENCE**: For complete AIGEN-Cycle UUID validation criteria, format requirements, and examples, refer to [`gen-cycle-guidelines.md ## AIGEN-Cycle Integration with Document Generation`](../00-common/gen-cycle-guidelines.md#aigen-cycle-integration-with-document-generation)

**Validation Checklist:** Ensure all documents comply with AIGEN-Cycle requirements as specified in the centralized guidelines.

#### Document Structure Validation
**Check for each document:**
- [ ] Document follows `doc-template.md` structure
- [ ] All required sections are present
- [ ] Placeholders (surrounded with `[]`) have been replaced with actual information
- [ ] Template instruction sections (inside `*( )*`) have been removed
- [ ] User Inputs Summary section is complete and accurate
- [ ] DOCUMENT CREATION section contains all required metadata
- [ ] DOCUMENT UPDATE LOG section is present (empty for new documents)

#### Format Compliance Review
**Check for each document:**
- [ ] Document uses proper markdown formatting
- [ ] Sections are properly organized and numbered
- [ ] Content is professional and well-structured
- [ ] No template artifacts remain in final document
- [ ] Document traceability is maintained through metadata

**[UX Instructions for the System]**
- After format review, provide summary: "Document format review completed. Found [X] issues across [Y] documents."
- If issues found, list specific problems and ask user if they want to:
  - "Fix format issues first" (recommended)
  - "Proceed with perspective review despite format issues"
  - "Abort review process"
- If no issues found, proceed to perspective selection

### Step 2: Perspective Selection
We need to review functional use cases from multiple stakeholder perspectives to ensure comprehensive validation.

**[UX Instructions for the System]**
- Prompt the user with: `Review {{repeat?again:""}} as - Business Owner | Senior Business Analyst | Senior Architect | Staff Engineer?`
- Provide guidance note: "You can type your options with combinations like - 'Senior Business Analyst and Staff Engineer'. You can also choose to abort the review process."
- Confirm user's choice: "Review aforesaid documents as {{options given by user}}"
- Present confirmation options: "Yes" & "No"
- If user chooses "Yes", proceed with the review from the chosen perspective(s)

### Step 3: Review Execution
**System Note:** Execute the review based on the selected perspective(s) and provide a comprehensive review summary.

### Step 4: Review Summary and Next Steps
**System Note:** After completing the review, provide a detailed summary and ask the user to proceed with updates or modifications.

## Review Cycles
Users may choose to perform multiple review cycles to ensure thorough validation from different perspectives.

**[UX Instructions for the System]**
- After each review cycle, circle back to the "Review Process Workflow" section
- Allow users to select different perspectives for subsequent review cycles
- Maintain session state to track completed reviews and remaining perspectives

## Review Perspectives

### Business Owner
- Focus on business value and ROI
- Validate alignment with business objectives
- Assess market fit and competitive advantage

### Senior Business Analyst
- Evaluate requirements completeness and clarity
- Check for gaps in business logic
- Validate user story acceptance criteria

### Senior Architect
- Review technical feasibility and scalability
- Assess system integration points
- Evaluate architectural consistency

### Staff Engineer
- Examine code quality and maintainability
- Review performance considerations
- Validate technical implementation approach

## Expected Outcomes
- Comprehensive review from multiple stakeholder perspectives
- Identified gaps, risks, and improvement opportunities
- Actionable feedback for use case refinement
- Quality assurance validation before development begins


