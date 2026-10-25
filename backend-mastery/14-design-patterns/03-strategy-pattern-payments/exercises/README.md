# Strategy Pattern - Exercises

## Exercise 1: Discount Strategy
Create strategies for different discount calculations:
- PercentageDiscount (e.g., 10% off)
- FixedAmountDiscount (e.g., $5 off)
- BuyOneGetOneDiscount

Each should: calculate(price), describe()

---

## Exercise 2: Search Strategy
Implement different search algorithms:
- LinearSearchStrategy
- BinarySearchStrategy
- HashTableSearchStrategy

Each should: search(array, value), getComplexity()

---

## Exercise 3: Compression Strategy
Build a compression system:
- GZipCompression
- BrotliCompression
- DeflateCompression

Each should: compress(data), decompress(data), getCompressionRatio()

---

## Exercise 4: Authentication Strategy
Create auth strategies:
- BasicAuthStrategy
- JWTStrategy
- OAuth2Strategy

Each should: authenticate(credentials), validate(token)

**Bonus:** Add strategy selection based on environment variables

---

## Exercise 5: Data Export Strategy
Implement exporters:
- CSVExporter
- JSONExporter
- XMLExporter
- PDFExporter

Each should: export(data), getFormat()

---

## Solutions
See `../../solutions/` for implementations.
