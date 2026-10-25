# 13.14: This Types & Method Chaining - Builder Pattern

## This Type Reference

**this** keyword in types refers to the current instance.

```typescript
class Builder {
  private value = '';

  setValue(val: string): this {
    this.value = val;
    return this;
  }

  append(str: string): this {
    this.value += str;
    return this;
  }

  build(): string {
    return this.value;
  }
}

const result = new Builder()
  .setValue('Hello')
  .append(' ')
  .append('World')
  .build();
```

---

## Method Chaining with This

```typescript
class Query {
  private filters: string[] = [];
  private limit: number = 10;

  where(condition: string): this {
    this.filters.push(condition);
    return this;
  }

  take(n: number): this {
    this.limit = n;
    return this;
  }

  execute(): string {
    return `SELECT * WHERE ${this.filters.join(' AND ')} LIMIT ${this.limit}`;
  }
}

const sql = new Query()
  .where('age > 18')
  .where('active = true')
  .take(5)
  .execute();
```

---

## This in Subtypes

```typescript
class Animal {
  move(): this {
    console.log('Moving');
    return this;
  }
}

class Dog extends Animal {
  bark(): this {
    console.log('Woof');
    return this;
  }
}

// Works correctly with subtype
new Dog().move().bark();
```
