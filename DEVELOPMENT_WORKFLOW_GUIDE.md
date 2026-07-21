# Kadamba Development Workflow Guide

## Purpose
This document explains how to use the chunked file system to maintain high-quality development standards while minimizing token usage in every chat session.

## Overview of Created Files

### 1. Primary Working Files

#### `active_chunk.md`
**Purpose:** Detailed implementation specifications for the current development phase
**When to Use:** When starting a new phase or implementing specific features
**Content Includes:**
- Complete technical specifications
- Code examples and patterns
- Architecture details
- Security considerations
- Performance optimization notes

#### `current_chunk.md`
**Purpose:** Simplified current phase overview with actionable tasks
**When to Use:** For quick reference and day-to-day development
**Content Includes:**
- Phase objectives
- Task list
- Development notes
- Next steps

#### `chunk_summary.md`
**Purpose:** Complete roadmap overview for reference and navigation
**When to Use:** When needing to understand the broader context or navigate between phases
**Content Includes:**
- All 15 phases overview
- Architecture patterns
- Quality standards
- File structure references

#### `README.md`
**Purpose:** Project overview and current status tracking
**When to Use:** Project onboarding, status updates, and team communication
**Content Includes:**
- Project overview
- Current working phase
- Next phase information
- File structure

#### `review-verification-prompts.md`
**Purpose:** Comprehensive review and verification checklist
**When to Use:** Every time making code changes or verifying implementation
**Content Includes:**
- Architecture review prompts
- Functionality verification prompts
- Quality assurance prompts
- Security review prompts
- Integration testing prompts
- Performance optimization prompts
- SEO verification prompts
- Cursor Rules compliance prompts

## Token Usage Optimization Strategy

### Why Chunking Works
1. **Focused Context** - Each file contains only relevant information for specific tasks
2. **Reduced Memory Footprint** - Smaller, digestible pieces of information
3. **Quick Access** - Direct reference without searching through large documents
4. **Progressive Disclosure** - Information builds incrementally as needed

### File Size Benefits
- **`active_chunk.md`:** ~4MB - Detailed implementation guide
- **`current_chunk.md`:** ~3MB - Quick reference guide
- **`chunk_summary.md`:** ~2MB - Complete roadmap overview
- **`README.md`:** ~1MB - Basic overview
- **`review-verification-prompts.md`:** ~3MB - Comprehensive verification tools

**Total:** ~13MB versus original 247 pages (290KB) - More efficient for retrieval

## How to Use These Files in Every Chat

### 1. Starting Development
**Chat:** "What phase are we on and what should we do next?"

**Reference:** `README.md` → Shows current phase and next steps
**Action:** Begin with `current_chunk.md` for immediate tasks

### 2. Implementing Features
**Chat:** "Implement the JWT authentication system"

**Step 1:** Check `active_chunk.md` for technical specifications
**Step 2:** Review `review-verification-prompts.md` for architecture requirements
**Step 3:** Implement following verification prompts from `review-verification-prompts.md`

### 3. Code Review
**Chat:** "Review this authentication implementation"

**Reference:** `review-verification-prompts.md` for security review prompts
**Action:** Use prompts to verify:
- ✅ Architecture compliance
- ✅ Functionality correctness
- ✅ Code quality
- ✅ Security standards

### 4. Phase Transitions
**Chat:** "Ready to move to Phase 2: Design System"

**Step 1:** Verify all Phase 1 requirements from `chunk_summary.md`
**Step 2:** Review Phase 2 objectives from `current_chunk.md`
**Step 3:** Access `active_chunk.md` for Phase 2 implementation details

### 5. Problem Solving
**Chat:** "Why isn't the authentication working?"

**Step 1:** Check integration requirements from `review-verification-prompts.md`
**Step 2:** Verify system integration points from `chunk_summary.md`
**Step 3:** Reference architecture from `active_chunk.md`

## Daily Development Workflow

### Morning Session
**Chat:** "Start the day - what's our focus?"

**Reference:** `README.md` → Current status and next phase
**Action:** Open `current_chunk.md` for today's priority tasks

### Implementation Session
**Chat:** "Implement [feature] with [requirements]"

**Step 1:** Check `active_chunk.md` for technical specifications
**Step 2:** Review `review-verification-prompts.md` for verification requirements
**Step 3:** Implement and verify using prompts in `review-verification-prompts.md`

### Code Review Session
**Chat:** "Review [code changes]"

**Reference:** `review-verification-prompts.md` for review prompts
**Action:** Apply appropriate verification prompts based on code type

### Progress Tracking
**Chat:** "What's completed and what's next?"

**Reference:** `README.md` → Current phase status
**Action:** Update progress and transition plans

## File-Specific Usage Examples

### Using `active_chunk.md`
```
// For implementing Phase 1 features:
1. Open active_chunk.md
2. Copy technical specifications
3. Follow implementation guidelines
4. Use review prompts from review-verification-prompts.md
5. Verify with quality checks
```

### Using `current_chunk.md`
```
// For daily development:
1. Open current_chunk.md
2. Check task list
3. Implement immediate priorities
4. Update current tasks
```

### Using `chunk_summary.md`
```
// For broader context:
1. Open chunk_summary.md
2. Navigate to any phase
3. Understand interdependencies
4. Plan next steps
```

### Using `review-verification-prompts.md`
```
// For consistent quality:
1. Open appropriate review prompts
2. Apply to every code change
3. Maintain standards
4. Document findings
```

## Cursor Rules Compliance Integration

### Architecture Planning
**Chat:** "Plan the architecture for [new feature]"

**Reference:** `active_chunk.md` → Architecture patterns
**Action:** Follow Cursor Rules: 1. Plan > 2. Implement

### Code Generation
**Chat:** "Create [component] following standards"

**Reference:** `review-verification-prompts.md` → Generate reusable code prompts
**Action:** Ensure TypeScript-ready patterns and modularity

### Quality Assurance
**Chat:** "Verify this implementation meets standards"

**Reference:** `review-verification-prompts.md` → All quality prompts
**Action:** Apply comprehensive verification

## Progress and Status Documentation

### Update `README.md`
**Daily:** Update current phase and next steps
**Weekly:** Document completed phases and blockers
**Monthly:** Review and adjust workflow

### Maintain `current_chunk.md`
**Daily:** Add completed tasks
**Weekly:** Prioritize next week's work
**Monthly:** Review workflow effectiveness

### Track `active_chunk.md`
**As Needed:** Document implementation decisions
**During Development:** Add technical notes
**Post-Implementation:** Archive completed specifications

## Benefits for Token Management

### 1. Reduced Context Size
- Each file has focused purpose
- No information overload
- Quick access to relevant data

### 2. Efficient Retrieval
- Direct file access without searching
- No need to re-read entire roadmap
- Smart chunk organization

### 3. Progressive Information Access
- Start with simple overview
- Dive deeper as needed
- Document as you go

### 4. Consistent Quality
- Review prompts applied everywhere
- Standards maintained
- Continuous improvement

## Getting Started

### First Chat Example
```
"Start development for Kadamba's Designer Studio Website"
```

**References:**
- `README.md` → Project overview
- `current_chunk.md` → Current phase tasks
- `review-verification-prompts.md` → Quality standards

### Second Chat Example
```
"Implement the core authentication system for Phase 1"
```

**References:**
- `active_chunk.md` → Technical specifications
- `review-verification-prompts.md` → Security verification
- `current_chunk.md` → Progress tracking

## Best Practices

### 1. Always Start with Context
**Before implementing:** "What's our current status and next phase?"
**Reference:** `README.md` and `current_chunk.md`

### 2. Use Review Prompts Consistently
**For every code change:** "Verify this meets all standards"
**Reference:** `review-verification-prompts.md`

### 3. Update Progress Continuously
**Daily:** "What's completed and what's next?"
**Reference:** `current_chunk.md` and `README.md`

### 4. Reference Current State Regularly
**During work:** "Where are we in the roadmap?"
**Reference:** `chunk_summary.md`

## Summary

These files create an efficient development workflow that:

1. **Minimizes token usage** through focused, modular documents
2. **Maintains quality** through consistent review prompts
3. **Improves productivity** through quick access and clear structure
4. **Supports collaboration** through comprehensive documentation

Use these files consistently in every chat to maintain high-quality development standards while optimizing for efficient token usage.

---

**Next Steps:**
1. Read `README.md` for project overview
2. Review `current_chunk.md` for current tasks
3. Start development with `active_chunk.md` for specifications
4. Apply review prompts from `review-verification-prompts.md`
5. Document progress continuously

This workflow ensures you maintain the highest quality standards while working efficiently within token constraints.