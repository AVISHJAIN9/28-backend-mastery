# Module 18: VM Module Sandbox - Checklist

## Core Concepts
- [ ] Understand vm.runInThisContext() vs vm.runInNewContext()
- [ ] Know when to use each method
- [ ] Understand sandbox context creation
- [ ] Know how to pre-compile scripts

## Security Concepts
- [ ] Always set timeout on untrusted code
- [ ] Minimize sandbox context exposure
- [ ] Never use eval() for untrusted code
- [ ] Understand prototype pollution risks
- [ ] Know how to isolate global scope

## Implementation Patterns
- [ ] Execute safe code with runInThisContext
- [ ] Run untrusted code in isolated context
- [ ] Implement timeout protection
- [ ] Create safe sandboxes with limited scope
- [ ] Handle execution errors properly

## Testing Scenarios
- [ ] Test basic arithmetic evaluation
- [ ] Test variable access in context
- [ ] Test timeout on infinite loop
- [ ] Test isolation from global scope
- [ ] Test with JSON/Math functions
- [ ] Test error handling
- [ ] Test pre-compiled scripts

## Performance
- [ ] Script pre-compilation
- [ ] Context reuse
- [ ] Timeout tuning
- [ ] Memory efficiency check

## Security Checklist
- [ ] No access to process object
- [ ] No access to filesystem
- [ ] No access to environment
- [ ] No prototype pollution
- [ ] Timeout protection enabled
- [ ] Error messages don't leak info
- [ ] Proper error handling

## API Endpoints
- [ ] POST /api/vm/execute-basic
- [ ] POST /api/vm/execute-context
- [ ] POST /api/vm/execute-timeout
- [ ] POST /api/vm/test-isolation
- [ ] GET /health
- [ ] GET /

## Deployment
- [ ] .env.example configured
- [ ] PORT set to 3018
- [ ] Dependencies installed
- [ ] Server starts: npm start
- [ ] Dev mode: npm run dev
- [ ] No console errors
