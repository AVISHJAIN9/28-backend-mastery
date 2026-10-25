# Search - Text & Vector Theory

## Full-Text Search with BM25

### Inverted Index
```
Document 1: "red car"
Document 2: "blue car"
Document 3: "red truck"

Inverted Index:
red → [Doc1, Doc3]
car → [Doc1, Doc2]
blue → [Doc2]
truck → [Doc3]

Query "red car" → [Doc1, Doc2, Doc3]
Rank by relevance using BM25
```

### BM25 Scoring Formula
```
BM25(D,Q) = Σ IDF(qi) * ((k1+1) * f(qi,D)) / (f(qi,D) + k1*(1-b+b*|D|/avgdl))

Where:
- IDF: Inverse document frequency
- f(qi,D): Frequency of term in document
- |D|: Document length
- avgdl: Average document length
```

## Vector Search with Embeddings

### Text to Vector
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

# Convert text to 384-dimensional vector
embedding1 = model.encode("red car")      # [0.2, 0.5, -0.1, ...]
embedding2 = model.encode("scarlet vehicle") # [0.19, 0.51, -0.09, ...]

# Similar vectors = similar meaning
cosine_similarity(embedding1, embedding2) = 0.98
```

### Vector Database Query
```sql
-- Find top 10 most similar documents
SELECT document_id, cosine_similarity(query_embedding, doc_embedding) as score
FROM documents
ORDER BY doc_embedding <-> query_embedding
LIMIT 10;
```

## Hybrid Search

```javascript
const hybridSearch = async (query) => {
  // 1. Text search
  const textResults = await elasticsearch.search({
    index: 'documents',
    body: {
      query: { match: { content: query } }
    }
  });
  
  // 2. Vector search
  const embedding = await getEmbedding(query);
  const vectorResults = await vectorDb.search({
    embedding: embedding,
    limit: 20
  });
  
  // 3. Merge and rerank
  const merged = new Map();
  
  textResults.forEach((result, idx) => {
    merged.set(result.id, {
      score: (textResults.length - idx) / textResults.length,
      source: 'text'
    });
  });
  
  vectorResults.forEach((result, idx) => {
    const key = result.id;
    const existing = merged.get(key);
    merged.set(key, {
      score: (existing?.score || 0) + (vectorResults.length - idx) / vectorResults.length,
      source: existing ? 'hybrid' : 'vector'
    });
  });
  
  // Sort by combined score
  return Array.from(merged.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10);
};
```
