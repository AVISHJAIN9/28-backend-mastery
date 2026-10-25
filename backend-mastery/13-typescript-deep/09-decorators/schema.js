const schema = {
  user: {
    id: 'number',
    name: 'string',
    email: 'string'
  },

  validate: (data, schema) => {
    for (const [key, type] of Object.entries(schema)) {
      if (typeof data[key] !== type) {
        throw new Error(`Invalid ${key}: expected ${type}`);
      }
    }
    return data;
  }
};

export default schema;
