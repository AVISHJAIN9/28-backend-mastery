# async/await - Code Review Checklist

## Syntax
- [ ] Proper async function syntax
- [ ] Correct await usage
- [ ] No bare Promise usage
- [ ] Proper error handling
- [ ] Return values correct

## Performance
- [ ] Not using sequential when parallel works
- [ ] Promise.all for independent ops
- [ ] Promise.race for timeouts
- [ ] Promise.allSettled for error handling
- [ ] No excessive nesting

## Best Practices
- [ ] Always handle errors
- [ ] Use try/finally for cleanup
- [ ] Avoid fire-and-forget
- [ ] Test error paths
- [ ] Document async behavior
