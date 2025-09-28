# User Management - Functional Use Cases

## User Inputs Summary
**Scope**: APPLICATION
**Application**: DocLib
**Module**: Authentication & Authorization
**Feature**: User Management
**Business Context**: Enable secure user management for the DocLib SaaS platform
**Target Users**: Admin
**Business Value**: Provides secure and efficient user management capabilities for the document library system
**Output Location**: ai/test/doclib/functional-use-cases/auth/user-management
**AIGEN-Cycle UUID**: K9MX-2R

## Document Creation
**Author**: System Generated
**Date Created**: [Current Date]
**AIGEN-Cycle UUID**: K9MX-2R
**Document Version**: 1.0

## Document Update Log
*(This section will track any updates to this document)*

## Introduction
This document outlines the functional use cases for the User Management feature of DocLib. The feature enables administrators to manage user accounts, their profiles, and system access.

## Use Cases

### UC-UM-01: User Registration
**Primary Actor**: Admin
**Description**: Create new user accounts in the system
**Preconditions**: 
- Admin is authenticated and authorized
- User email is not already registered

**Main Flow**:
1. Admin selects "Create New User"
2. System displays user creation form
3. Admin enters user details:
   - Email address
   - Full name
   - Role (Creator/Viewer)
   - Department (optional)
   - Contact information
4. System validates input
5. System creates user account
6. System sends welcome email with temporary password
7. System displays success message

**Alternative Flows**:
- A1: Email already exists
  1. System displays error message
  2. Admin enters different email
- A2: Invalid input
  1. System highlights invalid fields
  2. Admin corrects input

**Post-conditions**:
- New user account is created
- User receives welcome email
- User appears in user management dashboard

### UC-UM-02: User Profile Management
**Primary Actor**: Admin
**Description**: Modify existing user profiles
**Preconditions**: 
- Admin is authenticated and authorized
- User account exists

**Main Flow**:
1. Admin searches for user
2. System displays user profile
3. Admin modifies user details:
   - Name
   - Role
   - Department
   - Contact information
4. System validates changes
5. System updates user profile
6. System logs the changes

**Alternative Flows**:
- A1: User not found
  1. System displays "User not found" message
  2. Admin refines search
- A2: Invalid changes
  1. System displays validation errors
  2. Admin corrects input

**Post-conditions**:
- User profile is updated
- Change log is updated

### UC-UM-03: User Account Deactivation
**Primary Actor**: Admin
**Description**: Temporarily disable user access
**Preconditions**: 
- Admin is authenticated and authorized
- User account is active

**Main Flow**:
1. Admin selects user
2. Admin chooses "Deactivate Account"
3. System prompts for confirmation
4. Admin confirms deactivation
5. System deactivates account
6. System logs the action

**Alternative Flows**:
- A1: User has shared documents
  1. System displays warning
  2. Admin reviews shared documents
  3. Admin confirms or cancels deactivation

**Post-conditions**:
- User account is deactivated
- User cannot access system
- Shared documents remain accessible to others

### UC-UM-04: User Account Deletion
**Primary Actor**: Admin
**Description**: Permanently remove user account
**Preconditions**: 
- Admin is authenticated and authorized
- User account exists

**Main Flow**:
1. Admin selects user
2. Admin chooses "Delete Account"
3. System displays impact analysis:
   - Owned documents
   - Shared documents
   - Storage usage
4. Admin reviews impact
5. Admin confirms deletion
6. System processes deletion
7. System logs the action

**Alternative Flows**:
- A1: User has active shares
  1. System prompts for share handling
  2. Admin selects action for shares
  3. System processes accordingly

**Post-conditions**:
- User account is deleted
- User's documents are handled per policy
- System logs maintain deletion record

### UC-UM-05: User Access Audit
**Primary Actor**: Admin
**Description**: Review user access history
**Preconditions**: 
- Admin is authenticated and authorized

**Main Flow**:
1. Admin accesses audit section
2. Admin specifies audit criteria:
   - User(s)
   - Date range
   - Activity types
3. System generates audit report
4. Admin reviews report
5. Admin can export report

**Alternative Flows**:
- A1: No activity found
  1. System displays "No activities found"
  2. Admin modifies search criteria

**Post-conditions**:
- Audit report is generated
- Export is available if requested

## Business Rules
1. BR-UM-01: Email addresses must be unique and follow format user@domain.com
2. BR-UM-02: Passwords must meet security requirements:
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number
   - At least 1 special character
3. BR-UM-03: User roles must be assigned from predefined list: Admin, Creator, Viewer
4. BR-UM-04: Deactivated users cannot access system for minimum 24 hours
5. BR-UM-05: Deleted user data retained for 30 days before permanent deletion
6. BR-UM-06: Maximum failed login attempts: 5 within 15 minutes
7. BR-UM-07: Password reset links expire after 24 hours
8. BR-UM-08: User sessions timeout after 30 minutes of inactivity

## Technical Constraints
1. Maximum concurrent sessions per user: 5
2. Bulk user creation limit: 100 users per operation
3. API rate limit: 100 requests per minute per user
4. Maximum user profile image size: 5MB
5. Supported image formats: JPG, PNG
6. Audit log retention: 90 days
7. Maximum department hierarchy depth: 5 levels
8. Search results limit: 50 users per page

## Examples

### Example 1: User Registration Data
```json
{
  "email": "john.doe@company.com",
  "fullName": "John Doe",
  "role": "Creator",
  "department": "Engineering",
  "contactInfo": {
    "phone": "+1-555-0123",
    "location": "New York Office"
  }
}
```

### Example 2: User Search Criteria
```json
{
  "role": "Creator",
  "department": "Engineering",
  "status": "Active",
  "dateJoined": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  }
}
```

### Example 3: Audit Log Entry
```json
{
  "timestamp": "2024-01-22T10:30:00Z",
  "action": "USER_ROLE_CHANGE",
  "actor": "admin@company.com",
  "target": "john.doe@company.com",
  "changes": {
    "oldRole": "Viewer",
    "newRole": "Creator"
  }
}
```

## Success Metrics
1. User Registration:
   - Success Rate: >98% first-time completion
   - Average Completion Time: <3 minutes
2. Profile Updates:
   - Success Rate: >99%
   - Response Time: <2 seconds
3. User Search:
   - Response Time: <1 second for basic search
   - Response Time: <3 seconds for advanced filters
4. System Performance:
   - User List Loading: <2 seconds for up to 1000 users
   - Profile Image Loading: <1 second
   - Audit Log Query: <3 seconds

## Assumptions and Dependencies
1. Email service is available for notifications
2. Authentication system is operational
3. Audit logging system is available
4. Storage system is accessible

## Glossary
- **Admin**: System administrator with full user management rights
- **Creator**: User role for document creation and management
- **Viewer**: User role for document viewing only
- **Deactivation**: Temporary access removal
- **Deletion**: Permanent account removal 