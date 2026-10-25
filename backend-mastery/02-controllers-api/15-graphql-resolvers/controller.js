const { v4: uuidv4 } = require('uuid');

const resources = new Map();

class GraphQLResolvers {
  static Query = {
    resource: (_, { id }) => resources.get(id),
    resources: () => Array.from(resources.values()),
    resourceCount: () => resources.size
  };

  static Mutation = {
    createResource: (_, { input }) => {
      const id = uuidv4();
      const resource = { id, ...input, createdAt: new Date() };
      resources.set(id, resource);
      return resource;
    },
    updateResource: (_, { id, input }) => {
      const resource = resources.get(id);
      if (!resource) throw new Error('Not found');
      Object.assign(resource, input);
      return resource;
    },
    deleteResource: (_, { id }) => {
      const deleted = resources.has(id);
      resources.delete(id);
      return deleted;
    }
  };

  static Resource = {
    id: (parent) => parent.id,
    name: (parent) => parent.name,
    createdAt: (parent) => parent.createdAt
  };
}

module.exports = GraphQLResolvers;