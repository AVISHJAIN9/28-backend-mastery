# 10 - Mutation Testing with Stryker

## Overview
Validate test quality by mutating code and checking if tests catch the mutations.

## What You'll Learn
- **Mutation Testing** - Code quality validation
- **Stryker** - Mutation testing framework
- **Mutators** - Code transformation rules
- **Kill Score** - Test effectiveness
- **Isolated Tests** - Per-mutation runs
- **Performance** - Parallel execution

## Key Concepts

### What is a Mutation?
Small code change to verify test catches it:
```javascript
// Original
if (age > 18) { return true; }

// Mutation 1
if (age >= 18) { return true; }

// Mutation 2  
if (age > 18) { return false; }
```

### Kill Score
- **Good** - Test kills most mutations (>80%)
- **Bad** - Test misses mutations (<60%)
- **Perfect** - Test kills all mutations (100%)

## Benefits
1. Find weak tests
2. Improve coverage quality
3. Prevent false confidence
4. Better refactoring safety
5. Identify edge cases

## Mutation Types
- **Arithmetic** - Change +/- operators
- **Assignment** - Change variable values
- **Logical** - Flip && to ||  
- **Return** - Remove returns
- **Const** - Change literals

## Quick Start
```bash
npm install @stryker-mutator/core
npm run stryker
```

## Interpreting Results
- Killed - Test caught mutation
- Survived - Test missed mutation  
- Timeout - Mutation caused infinite loop
- No Coverage - Never executed

## Performance
- Run in parallel
- Skip low-coverage code
- Cache results
- Use incremental
- Target specific files

## Integration
- CI/CD pipelines
- Performance monitoring
- SLA enforcement
- Team dashboards
