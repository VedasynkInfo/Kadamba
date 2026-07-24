# Complete Development Review & Verification Prompts

## Purpose
These comprehensive prompts ensure consistent code quality and functionality verification across all development phases. Use these in every chat to maintain standards and verify implementation.

## Boutique ERP feature prompts (primary for new work)

For **what to build** (ERP + CRM + Portal + CMS Phase 2), use:

- **Master prompts:** `documents/boutique_erp_prompts.md`
- **PRD index:** `documents/prd/00_INDEX.md`
- **Active chunk:** `active_chunk.md` (currently Measurement System)
- **Status:** `documents/prompts_status.md`

This file (`complete_prompts.md`) remains the **QA / architecture / security review** pack.

## Development Review Checklist

### 1. Architecture Review Prompt
**"Please review if this implementation follows Kadamba's development architecture:
- ✅ Uses TypeScript (not JavaScript)
- ✅ Follows modular component structure
- ✅ Implements proper error handling
- ✅ Includes comprehensive validation
- ✅ Adheres to security best practices
- ✅ Uses production-ready patterns
- ✅ Includes proper TypeScript typing
- ✅ Follows Cursor Rules: Plan > Implement > Test > Document"""

### 2. Functionality Verification Prompt
**"Verify this code works as intended by checking:
- ✅ Core features implement all requirements
- ✅ Edge cases are handled properly
- ✅ Error scenarios are covered
- ✅ Performance optimizations are in place
- ✅ Responsive design works across devices
- ✅ API endpoints return expected data structure
- ✅ Authentication and authorization are secure
- ✅ All validation rules are enforced"""

### 3. Quality Assurance Prompt
**"Assess code quality by evaluating:
- ✅ Linting compliance (ESLint/Prettier)
- ✅ Test coverage (>90% target)
- ✅ Code complexity and maintainability
- ✅ Documentation completeness
- ✅ Performance benchmarks
- ✅ Accessibility standards (WCAG 2.1)
- ✅ SEO optimization compliance
- ✅ Mobile-first responsive design"""

### 4. Security Review Prompt
**"Conduct security assessment by verifying:
- ✅ Input sanitization and validation
- ✅ Authentication mechanisms (JWT)
- ✅ Authorization controls
- ✅ File upload security
- ✅ Environment variable protection
- ✅ Rate limiting implementation
- ✅ CORS configuration
- ✅ Error handling doesn't leak sensitive data
- ✅ HTTPS requirements"""

### 5. Integration Testing Prompt
**"Test integration with other systems:
- ✅ API endpoint connectivity
- ✅ Database operations
- ✅ Third-party service integrations (Cloudinary, Nodemailer)
- ✅ Frontend-backend communication
- ✅ Authentication flow testing
- ✅ File upload/download functionality
- ✅ Email notification system"""

### 6. Performance Optimization Prompt
**"Evaluate performance improvements:
- ✅ Image optimization (Cloudinary integration)
- ✅ Code splitting and lazy loading
- ✅ Bundle size analysis
- ✅ Caching strategies
- ✅ Database query optimization
- ✅ Responsive performance metrics
- ✅ Mobile loading speeds"""

### 7. SEO Verification Prompt
**"Check SEO implementation:
- ✅ Meta tags and OpenGraph
- ✅ Twitter Card markup
- ✅ Schema.org structured data
- ✅ Alt text for all images
- ✅ Robots.txt and sitemap
- ✅ Canonical URL implementation
- ✅ Semantic HTML structure
- ✅ Fast page load times"""

### 8. Cursor Rules Compliance Prompt
**"Ensure adherence to Cursor Rules:
- ✅ Phase 1 complete before starting Phase 2
- ✅ No placeholder code (unless marked TODO)
- ✅ TypeScript-ready patterns used
- ✅ Modular, reusable components
- ✅ Architecture planning before implementation
- ✅ No code duplication
- ✅ Production-ready code standards"""

## Automated Review Workflow

### Pre-Implementation Review
```bash
# Run before implementing any code
npm run lint
npm run test
npm run build
# Review architecture design
git diff --cached
```

### During Development
```bash
# Continuous monitoring
git status
git diff
npm run format
# Review PR changes
```

### Post-Implementation Review
```bash
# Final verification
npm run test:coverage
npm run lint:fix
git status
# Security audit
npm audit
```

## File-Specific Prompts

### Frontend Components
**"Review React component: {component-name}"
- ✅ Component follows naming conventions
- ✅ Proper TypeScript props/interface
- ✅ Accessibility compliant
- ✅ Responsive design
- ✅ Test coverage
- ✅ Storybook documentation
- ✅ Accessibility testing""

### Backend Services
**"Review API endpoint: {endpoint-path}"
- ✅ Proper error handling
- ✅ Input validation
- ✅ Authentication/authorization
- ✅ Rate limiting
- ✅ Logging
- ✅ Response structure
- ✅ CORS configuration""

### Database Models
**"Review database model: {model-name}"
- ✅ Schema validation
- ✅ Indexes for performance
- ✅ Relationship definitions
- ✅ Security considerations
- ✅ Migration compatibility
- ✅ Data integrity constraints""

## Development Best Practices

### When Implementing New Features
1. **Start with Architecture Planning**
   - "What's the proposed architecture for this feature?"
   - "How does this integrate with existing systems?"
   - "What are the security implications?"

2. **Generate Reusable Code**
   - "Can this be used in multiple places?"
   - "Is this component generic enough?"
   - "How can we reduce duplication?"

3. **Test Thoroughly**
   - "What's the test coverage?"
   - "Are edge cases covered?"
   - "How do we verify performance?"

### When Debugging Issues
1. **Systematic Investigation**
   - "What should this code do? (requirements)"
   - "What is it actually doing? (debugging)"
   - "Is it working as expected? (testing)"

2. **Root Cause Analysis**
   - "What triggered this issue?"
   - "What system components are involved?"
   - "How can we prevent this?"

### When Reviewing PRs
1. **Code Review**
   - "Does this solve the problem efficiently?"
   - "Is the code readable and maintainable?"
   - "Are there any security risks?"

2. **Functional Review**
   - "Does this work in all scenarios?"
   - "Are there any missing edge cases?"
   - "Is the UX consistent?"

## Progress Tracking Prompts

### Daily Development Check
**"What's completed today? What's next? What's blocking?"
- ✅ Phase completion tracking
- ✅ Task progress
- ✅ Blocked items identification
- ✅ Dependency management

### Weekly Review
**"How did we do this week? What's next? What improvements needed?"
- ✅ Project milestone achievement
- ✅ Process improvements
- ✅ Team coordination
- ✅ Quality metrics review

## Template Usage

### Replace {placeholder} with actual values
**Example Usage:**
- "Review React component: Header"
- "Review API endpoint: /api/auth/login"
- "Review database model: User"
- "What's the proposed architecture for this feature?"

### Quick Reference Commands
```bash
# Development setup
npm install
npm run dev

# Testing
npm run test
npm run test:watch

# Code quality
npm run lint
npm run format

# Build and deploy
npm run build
git push
```

## Success Criteria

### Meeting Standards
- ✅ All phases completed in sequence
- ✅ Code quality metrics met (>90% coverage, 100% linting)
- ✅ Security audits passed
- ✅ Performance benchmarks satisfied
- ✅ SEO requirements fulfilled
- ✅ User documentation complete

### Continuous Improvement
- ✅ Lessons learned documented
- ✅ Process optimized
- ✅ Team feedback incorporated
- ✅ Technical debt managed
- ✅ Knowledge shared

Use these prompts consistently in every chat to maintain high-quality development standards and ensure successful project completion.