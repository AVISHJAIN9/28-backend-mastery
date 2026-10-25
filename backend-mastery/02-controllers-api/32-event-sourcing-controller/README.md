# Event Sourcing Controller

## What is this?

Event sourcing pattern for immutable event logs and state reconstruction.

## Features
- Append-only event log
- State reconstruction
- Event replay
- Temporal queries

## Why does it matter?

Event sourcing provides complete audit trails and enables complex event analysis.

## How it works

1. Command received
2. Validate and create event
3. Append to immutable log
4. Publish event
5. Update read models
6. Return result

## Real world usage

- Audit logging
- Temporal databases
- Financial transactions
- Domain-driven design
