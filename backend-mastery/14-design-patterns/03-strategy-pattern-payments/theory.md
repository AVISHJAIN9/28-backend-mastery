# Strategy Pattern: Different Algorithms at Runtime

## What is the Strategy Pattern?

The **Strategy Pattern** is a behavioral design pattern that defines a family of algorithms, encapsulates each one, and makes them interchangeable. It lets the algorithm vary independently from the clients that use it.

## Key Characteristics

1. **Algorithm Families** - Related algorithms grouped together
2. **Encapsulation** - Each algorithm wrapped in a separate class
3. **Interchangeability** - Algorithms can be swapped at runtime
4. **Context** - Class that uses the algorithm (payment processor)
5. **Strategy Interface** - Common interface for all algorithms

## Real-World Analogy

Payment processing is a perfect example:
- Different payment methods (credit card, PayPal, Apple Pay)
- Each has different processing logic
- Customer chooses payment method (strategy)
- System uses selected strategy to process payment
- Easy to add new payment methods without changing core code

## Why Use Strategy Pattern?

### 1. **Runtime Algorithm Selection**
Different payment methods chosen at checkout time.

### 2. **Avoiding Conditional Logic**
No if/else chains for payment type selection.

### 3. **Easy Extension**
Add cryptocurrency payment without touching other strategies.

### 4. **Testability**
Test each payment strategy independently.

## Payment Processing Strategies

1. **Credit Card** - Visa, Mastercard, Amex
2. **PayPal** - OAuth and API integration
3. **Cryptocurrency** - Blockchain verification
4. **Bank Transfer** - ACH processing
5. **Buy Now Pay Later** - Installment payments

## Benefits

1. **Flexibility** - Swap algorithms easily
2. **Open/Closed Principle** - Open for extension, closed for modification
3. **Eliminate Conditionals** - If/else chains disappear
4. **Testability** - Each strategy independently testable
5. **Maintainability** - Changes isolated to strategy classes
6. **Runtime Selection** - Choose algorithm based on user input

## Strategy vs State

| Strategy | State |
|----------|-------|
| Client chooses algorithm | Object changes behavior itself |
| Algorithms independent | Behavior tied to state |
| Many strategies can coexist | One state at a time |

## Real-World Examples

- **Payment Processing** - Different payment gateways
- **Sorting** - Bubble sort, Quick sort, Merge sort
- **Compression** - ZIP, RAR, 7z algorithms
- **Shipping** - Different delivery methods
- **Authentication** - Password, OAuth, JWT

## Best Practices

1. Define strategy interface clearly
2. Keep strategies focused and single-purpose
3. Use factory for strategy creation
4. Document all available strategies
5. Handle strategy-specific errors
6. Log which strategy was selected
7. Validate strategy availability
8. Consider async operations

## Common Mistakes

1. **God Strategy** - Strategy with too many responsibilities
2. **Tight Coupling** - Strategy depends on context
3. **Missing Interface** - No common method signatures
4. **No Error Handling** - Not handling strategy failures
5. **Hard-coded Selection** - Not allowing dynamic strategy choice

## Conclusion

Strategy Pattern is essential for:
- Managing multiple algorithms for same task
- Reducing complex conditional logic
- Making code more maintainable and testable
- Following SOLID principles
- Building flexible payment systems
