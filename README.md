# Service: ms-checkpoint-processor

An asynchronous background worker service responsible for processing and persisting tracking events from the message broker.

## Core Responsibilities

-   Subscribes to the `checkpoints-topic` on the message broker.
-   Receives `Checkpoint` creation events.
-   Performs the necessary data transformations (e.g., finding the `shipment_id` from the `trackingId`).
-   Persists the final `Checkpoint` entity to the PostgreSQL database.
-   Sends an acknowledgement (`ack`) to the message broker upon successful processing to ensure message delivery guarantees.
-   Follows Clean Architecture principles.

## Technology Stack

-   **Framework**: NestJS
-   **Language**: TypeScript
-   **Database Interaction**: `pg` (raw SQL, no ORM) via Repository Pattern
-   **Messaging**: `@google-cloud/pubsub` client library

## Running the Service (Local Development)

This service is part of the project's Docker Compose setup. It starts automatically with the other services.

1.  Navigate to the root directory of the project.
2.  Run the following command:
    ```bash
    docker-compose up
    ```
The service will start and immediately begin listening for messages.

## Environment Variables

| Variable               | Description                                           | Example Value              |
| ---------------------- | ----------------------------------------------------- | -------------------------- |
| `DATABASE_HOST`        | Hostname of the PostgreSQL database.                  | `db`                       |
| `DATABASE_PORT`        | Port of the PostgreSQL database.                      | `5432`                     |
| `DATABASE_USER`        | Username for the database connection.                 | `user`                     |
| `DATABASE_PASSWORD`    | Password for the database connection.                 | `password`                 |
| `DATABASE_NAME`        | The name of the database to connect to.               | `tracking_db`              |
| `PUBSUB_EMULATOR_HOST` | The host and port of the Google Pub/Sub emulator.     | `pubsub-emulator:8085`     |

## API Endpoints

This service **does not** expose any public HTTP endpoints. Its sole entry point is the message subscription.

## Events Consumed

-   **Topic**: `checkpoints-topic`
-   **Subscription**: `checkpoints-subscription`
-   **Action**: Upon receiving a message, it uses the `SaveCheckpointUseCase` to look up the shipment and persist the new checkpoint to the `checkpoints` table.

## How to Run Tests

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e