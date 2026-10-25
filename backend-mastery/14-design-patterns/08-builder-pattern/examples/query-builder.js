/**
 * Builder Pattern - Complex Object Construction
 * 
 * Step-by-step construction of complex objects.
 */

class QueryBuilder {
  constructor() {
    this.query = {
      select: [],
      from: null,
      joins: [],
      where: [],
      orderBy: [],
      limit: null
    };
  }

  select(...columns) {
    this.query.select.push(...columns);
    return this;
  }

  from(table) {
    this.query.from = table;
    return this;
  }

  join(table, condition) {
    this.query.joins.push({ table, condition });
    return this;
  }

  where(condition) {
    this.query.where.push(condition);
    return this;
  }

  orderBy(field, direction = 'ASC') {
    this.query.orderBy.push({ field, direction });
    return this;
  }

  limit(count) {
    this.query.limit = count;
    return this;
  }

  build() {
    let sql = `SELECT ${this.query.select.join(', ')} FROM ${this.query.from}`;
    
    this.query.joins.forEach(j => sql += ` JOIN ${j.table} ON ${j.condition}`);
    if (this.query.where.length) sql += ` WHERE ${this.query.where.join(' AND ')}`;
    if (this.query.orderBy.length) {
      sql += ` ORDER BY ` + this.query.orderBy.map(o => `${o.field} ${o.direction}`).join(', ');
    }
    if (this.query.limit) sql += ` LIMIT ${this.query.limit}`;

    return sql;
  }
}

// Usage with method chaining
const query = new QueryBuilder()
  .select('id', 'name', 'email')
  .from('users')
  .where('age > 18')
  .where('status = "active"')
  .orderBy('name', 'ASC')
  .limit(10)
  .build();

console.log(query);

module.exports = QueryBuilder;
