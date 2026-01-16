# Automator Patterns Guide

## What Are Automators?

**Automators** (also called "Processes") are interactive, guided workflows that walk users through multi-step tasks. Think of them as "wizards" that:
- Ask questions step-by-step
- Branch based on answers
- Update deal data automatically
- Mark checklist items complete
- Create audit trail entries

**Key Differentiator:** This is what sets our app apart from simple CRUD apps.

---

## Core Concepts

### Process Definition (Template)
The blueprint for a workflow:
- Name: "Call the Seller"
- Steps: Sequential questions/actions
- Branching logic: If/then paths
- Outcomes: What gets updated

**Pattern:** These are reusable templates. One definition, many instances.

### Process Instance (Execution)
A specific run of an automator on a specific deal:
- Current step position
- User responses captured
- Status: Running, Completed, Canceled
- Who started it, when

**Pattern:** Track state so users can pause and resume.

---

## Step Types (Common Patterns)

### 1. Yes/No Decision
Simple binary choice, often with branching:
- "Did you reach the seller?" → Yes/No
- Yes → Continue to next step
- No → Log "No answer" and end

**Use when:** Binary decisions that affect flow.

### 2. Date Selection
Pick a date that updates a deal field:
- "When is the inspection?" → Date picker
- Updates: `inspection_date` field
- May mark checklist item

**Use when:** Scheduling events, setting deadlines.

### 3. Text Input
Capture notes or detailed information:
- "Notes from the call?" → Text area
- Saved to deal notes or specific field

**Use when:** Qualitative information, summaries.

### 4. Dropdown Selection
Choose from predefined options:
- "Reason for selling?" → List of reasons
- Saves to deal field

**Use when:** Standardized data, limited options.

### 5. Multi-Select
Choose multiple items:
- "What tasks for the runner?" → Checkboxes
- Photos, Meet Seller, Deliver Contract, etc.

**Use when:** Multiple options can apply.

### 6. Number Input
Capture numeric values:
- "Buyer's offer amount?" → Number field
- Validates: Must be > 0
- Updates deal financials

**Use when:** Money, quantities, measurements.

### 7. File Upload
Attach documents or photos:
- "Upload inspection report" → File picker
- Stored in Supabase Storage
- Linked to deal

**Use when:** Documentation needed.

### 8. Information Display
Show info, no input required:
- "Next, coordinate with title company"
- User clicks "Continue"

**Use when:** Instructions, context, waiting.

---

## Branching Patterns

### Simple If/Then
```
Step 1: Question → Yes/No
  - Yes → Go to Step 2
  - No → End process
```

### Multi-Way Branch
```
Step 1: Choose option → A/B/C
  - A → Steps 2-4
  - B → Steps 5-7
  - C → End
```

### Conditional Skip
```
Step 1: Already done? → Yes/No
  - Yes → Skip to Step 5
  - No → Continue to Step 2
```

### Loop Back (Advanced)
```
Step 3: Try again? → Yes/No
  - Yes → Return to Step 1
  - No → Continue to Step 4
```

---

## Side Effects (What Automators Do)

### Update Deal Fields
- Set dates (inspection, closing)
- Change status (Active → Pending Sale)
- Update financials (offer amount)

**Pattern:** Direct field updates based on user input.

### Mark Checklist Items
- "Initial Photos Needed" ✓
- "POA Obtained" ✓
- Auto-populate dates

**Pattern:** Checklist tracks what's done, automator does the work.

### Create Activity Logs
- "John completed 'Call the Seller' automator"
- "Step 2: Scheduled inspection for 2025-01-20"

**Pattern:** Audit trail of automator execution.

### Add Notes
- Save text input to deal notes
- Timestamp and attribute to user

**Pattern:** Capture context, not just data.

### Create Relationships
- Link vendor to deal (Runner hired)
- Add buyer to showing

**Pattern:** Connect entities as workflow progresses.

---

## State Management Patterns

### Saving Progress
Users may navigate away mid-automator:
- Save current step
- Save responses so far
- Status stays "Running"
- "Resume" button to continue

**Pattern:** Don't lose work, allow interruption.

### Completion
When all steps done or early exit:
- Status → "Completed"
- Set completion timestamp
- Final activity log entry
- Can't edit completed instances

**Pattern:** Immutable history.

### Cancellation
User decides to stop:
- Status → "Canceled"
- Keep responses captured so far
- Log cancellation reason (optional)

**Pattern:** Allow abandonment, track it.

---

## Validation Patterns

### Required Fields
Some steps must be answered:
- Can't proceed without answer
- Show error if user tries to skip

**Pattern:** Enforce data quality.

### Data Validation
Input must meet criteria:
- Dates must be in future (usually)
- Numbers must be positive
- Files must be specific types

**Pattern:** Catch errors early.

### Business Rules
Domain-specific validation:
- Inspection date must be before closing
- Offer must be reasonable range
- Can't run same automator twice simultaneously

**Pattern:** Enforce business logic.

---

## UI/UX Patterns

### Progress Indicator
Show where user is:
- "Step 3 of 7"
- Progress bar
- Breadcrumb trail

**Pattern:** Set expectations, reduce anxiety.

### Navigation
Allow moving through steps:
- "Next" button (primary action)
- "Back" button (optional, careful with state)
- "Cancel" option (always available)

**Pattern:** User control, but guide forward.

### Review Before Complete
Show summary of answers:
- "You answered X, Y, Z"
- "This will update A, B, C"
- Confirm or edit

**Pattern:** Prevent mistakes, build confidence.

---

## Common Automator Examples

### "Call the Seller" (Simple)
1. Did you reach them? (Yes/No)
2. Are they motivated? (Yes/No)
3. Reason for selling? (Dropdown)
4. Schedule property visit (Date)
5. Call notes (Text)

**Outcome:** Scheduled inspection, captured motivation.

### "Hire Runner" (With Relationships)
1. What tasks? (Multi-select)
2. Which runner? (Dropdown of vendors)
3. When should they go? (Date/Time)
4. Did they get POA? (Yes/No)

**Outcome:** Vendor assigned, task scheduled, checklist updated.

### "Buyer Showing" (Complex)
1. Select buyer (Dropdown)
2. Schedule showing (Date/Time)
3. Was showing completed? (Yes/No, waits for date)
4. Buyer interested? (Yes/No)
5. What's their offer? (Number)
6. Accept offer? (Yes/No)

**Outcome:** Showing tracked, offer captured, status may change.

---

## Data Structure Approach

### JSON Definition (Flexible)
Store automator steps as JSON:
```json
{
  "name": "Call the Seller",
  "steps": [
    {
      "id": 1,
      "type": "yes_no",
      "question": "Did you reach the seller?",
      "branches": {
        "yes": {"next": 2},
        "no": {"action": "end"}
      }
    }
  ]
}
```

**Pattern:** Flexible, no code changes for new automators.

### State Tracking
Store instance state as JSON:
```json
{
  "current_step": 3,
  "responses": {
    "1": {"answer": "yes"},
    "2": {"answer": "yes"},
    "3": {"answer": "inherited"}
  }
}
```

**Pattern:** Resume from any point.

---

## Integration Patterns

### With Checklists
- Automator marks checklist items
- Checklist shows "populated by: [automator name]"
- Date auto-fills from automator response

### With Activities
- Each step can log an activity
- Completion logs final activity
- Format: "[User] completed [Automator] - [Summary]"

### With Deal Fields
- Direct updates to deal fields
- Validate before saving
- Option to confirm before overwriting

### With Notifications
- Notify TC when automator completes
- Notify team when critical step reached
- Email or in-app based on preferences

---

## When to Use Automators

### Good Use Cases
- Multi-step processes with logic
- Repeated workflows (onboarding, closing)
- Data collection that updates multiple fields
- When guidance is helpful

### Not Needed For
- Single field updates (just use a form)
- Simple yes/no without branching
- One-off tasks

**Pattern:** Automators add value when there's complexity or repetition.

---

## Technical Considerations

### Execution Engine
Need logic to:
- Evaluate conditionals
- Determine next step
- Execute side effects (updates, logs)
- Handle errors gracefully

**Pattern:** Server-side execution for consistency (Edge Function recommended).

### Concurrency
Prevent issues:
- Can't run same automator twice on same deal
- Check for existing "Running" instance
- Lock during execution

**Pattern:** One at a time per automator per deal.

### Performance
Consider:
- Large JSON storage (okay for hundreds of steps)
- Real-time updates to deal fields
- Activity log insertions

**Pattern:** Batch related updates, use transactions.

---

## Future Enhancements

### Templates
- Pre-built automators for common tasks
- Organizations can clone and customize
- Share across teams

### Advanced Logic
- Nested conditionals (if/else if/else)
- Parallel branches (run multiple paths)
- Wait for external events (webhooks)

### Analytics
- Track completion rates
- Identify where users drop off
- Average time to complete

---

## Building Automator Features

When implementing automator functionality, consider:

1. **How is this automator defined?**
   - JSON structure? UI builder?

2. **How do users start it?**
   - Button on deal page? Auto-triggered?

3. **What data does it need?**
   - Access to deal fields? Contact lists?

4. **What can it update?**
   - Which fields? Which tables?

5. **How is state persisted?**
   - Database? Local storage?

6. **How do errors get handled?**
   - Rollback? Partial save? Retry?

---

**Remember:** Automators are guided workflows that make complex processes simple. The specific automator definitions and business rules will be in GitHub issues. This guide provides patterns for how to think about and implement them.
