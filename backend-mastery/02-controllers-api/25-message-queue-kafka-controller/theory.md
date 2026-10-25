# Message Queue Theory

## Pub/Sub vs Message Queues
- **Pub/Sub**: Many subscribers get same message (broadcast)
- **Queue**: One consumer processes each message (exclusive)

## Kafka Concepts
- **Topic**: Named stream of records
- **Partition**: Ordered, immutable sequence
- **Consumer Group**: Multiple consumers share work
- **Offset**: Position in partition

## Guarantees
- **At-most-once**: No duplication, possible loss
- **At-least-once**: No loss, possible duplication
- **Exactly-once**: Perfect delivery (expensive)
