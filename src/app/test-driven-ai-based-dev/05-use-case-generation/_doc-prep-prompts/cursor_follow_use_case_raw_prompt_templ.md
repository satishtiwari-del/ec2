# Follow use case raw prompt template
_Exported on 7/8/2025 at 18:04:08 GMT+5:30 from Cursor (1.2.2)_

---

**User**

Follow @use-case-raw-prompt-app-template.md 

---

**Cursor**

I'll follow the use case generation prompt template. Let me start by asking for the required information one by one.

## Primary Information Inputs

**Scope**: Please choose one from the following options:
- APPLICATION
- MODULE  
- FEATURE
- ENHANCEMENT

Which scope level would you like me to generate use cases for?

---

**User**

FEATURE

---

**Cursor**

**Scope**: FEATURE ✓

**FEATURE**: Please provide the name of the specific feature you want me to generate use cases for.

What is the name of the feature?

---

**User**

Add Username/Password as new authentication method

---

**Cursor**

**FEATURE**: Add Username/Password as new authentication method ✓

**APPLICATION**: Please provide the name of the application this feature belongs to.

What is the name of the application?

---

**User**

Optima Platform

---

**Cursor**

**APPLICATION**: Optima Platform ✓

**MODULE**: Please provide the name of the module this authentication feature belongs to (e.g., "Authentication", "Security", "User Management", etc.).

What is the name of the module?

---

**User**

Authentication

---

**Cursor**

**MODULE**: Authentication ✓

**Business Context**: Please describe the business problem this username/password authentication feature solves.

What business problem does adding username/password authentication solve for the Optima Platform?

---

**User**

We already have Firebase integration. Some users might not want to use their existing account and create standalone credentials on Optima Platform.

---

**Cursor**

**Business Context**: We already have Firebase integration. Some users might not want to use their existing account and create standalone credentials on Optima Platform. ✓

**Target Users**: Please list the primary users/actors who will use this username/password authentication feature.

Who are the target users for this authentication method?

---

**User**

All users of Optima Platform

---

**Cursor**

**Target Users**: All users of Optima Platform ✓

**Business Value**: Please explain the business benefit this username/password authentication feature provides.

What business benefit does adding username/password authentication provide to the Optima Platform?

---

**User**

Giving users flexibility how they want to authenticate themselves on Optima Platform.

---

**Cursor**

**Business Value**: Giving users flexibility how they want to authenticate themselves on Optima Platform. ✓

**Output Location Root**: Based on the information provided, I suggest the following output location:

`apps/optima-platform/authentication/add-username-password-auth/`

This follows the folder structure guidelines:
- **Application**: `optima-platform/`
- **Module**: `authentication/` 
- **Feature**: `add-username-password-auth/`

Does this output location work for you, or would you prefer a different location?

---

**User**

Yes

---

**Cursor**

**Output Location Root**: `apps/optima-platform/authentication/add-username-password-auth/` ✓

## Summary of Your Inputs

**Scope**: FEATURE  
**APPLICATION**: Optima Platform  
**MODULE**: Authentication  
**FEATURE**: Add Username/Password as new authentication method  
**Business Context**: We already have Firebase integration. Some users might not want to use their existing account and create standalone credentials on Optima Platform.  
**Target Users**: All users of Optima Platform  
**Business Value**: Giving users flexibility how they want to authenticate themselves on Optima Platform.  
**Output Location Root**: `apps/optima-platform/authentication/add-username-password-auth/`

**Please confirm**: Should I proceed to generate comprehensive functional use cases for the "Add Username/Password as new authentication method" feature based on these inputs?

---

**User**

No. Stop.

---

**Cursor**

Understood. I'll stop the use case generation process as requested.

