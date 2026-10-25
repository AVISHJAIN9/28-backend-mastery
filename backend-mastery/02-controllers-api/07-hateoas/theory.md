# HATEOAS Pattern

Hypermedia-driven API where clients discover operations through links:

1. **Links in Responses**: Each resource includes `_links` object with available actions
2. **Navigation**: Links for self, parent, next, prev enable client navigation
3. **Action Discovery**: Client learns URLs dynamically, no hardcoding
4. **Self-Describing**: Responses include metadata about possible operations
5. **Reduced Coupling**: Server can change URLs without breaking clients

Benefits: Flexibility, discoverability, reduced client brittleness.

