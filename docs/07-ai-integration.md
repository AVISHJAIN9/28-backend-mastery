# AI & Machine Learning Backend Integration

## Architecture Patterns
- **Streaming LLM Gateways**: Utilizing Server-Sent Events (SSE) and Node.js Readable streams to pipe token streams directly to frontend clients with sub-50ms Time-to-First-Token (TTFT).
- **Vector Embeddings Pipeline**: Chunking document text, generating embeddings via fast ONNX or cloud APIs, and querying vector databases with cosine distance metrics.
