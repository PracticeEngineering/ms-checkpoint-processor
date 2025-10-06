# Service: ms-checkpoint-processor

An asynchronous background worker service responsible for processing and persisting tracking events received via a Pub/Sub push subscription.

## Core Responsibilities

-   **Receives Events via HTTP**: Exposes an HTTP endpoint to accept push messages from a Google Pub/Sub subscription.
-   **Processes Checkpoints**: Subscribes to events related to checkpoint creation.
-   **Transactional Persistence**: Persists the `Checkpoint` entity and updates the parent `Shipment` status within a single database transaction (Unit of Work pattern).
-   **Handles Missing Shipments**: If a message is received for a non-existent `trackingId`, it logs the issue. (Note: A Dead Letter Queue (DLQ) is planned but not yet implemented).
-   **Follows Clean Architecture**: Isolates business logic from infrastructure for clarity and testability.

## Architecture

This service is an event-driven worker. Its entry point is not a traditional user-facing API, but an endpoint designed to be called by Google Pub/Sub.

1.  **Pub/Sub Push**: Google Pub/Sub sends a `POST` request to the `/` endpoint with the event payload.
2.  **Controller**: The `AppController` receives the request, decodes the Base64-encoded message, and passes it to the use case.
3.  **Use Case**: The `SaveCheckpointUseCase` orchestrates the work by using a transactional Unit of Work.
4.  **Unit of Work**: The `PostgresTransaction` provider ensures that all database operations (finding the shipment, saving the checkpoint, updating the shipment's status) either complete successfully or fail together, preventing data inconsistency.

## Technology Stack

-   **Framework**: NestJS
-   **Language**: TypeScript
-   **Database Interaction**: `pg` with a transactional Unit of Work pattern.
-   **Messaging**: Listens to a Google Pub/Sub push subscription.

## Running the Service (Local Development)

This service is part of the project's Docker Compose setup. It starts automatically with the other services.

1.  Navigate to the root directory of the project.
2.  Run the following command:
    ```bash
    docker-compose up
    ```
The service will start and be ready to receive push notifications from the Pub/Sub emulator.

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

### Pub/Sub Push Endpoint

-   **Endpoint**: `POST /`
-   **Description**: This is a private endpoint intended to be called exclusively by Google Pub/Sub's push subscription mechanism. It is not for public use.
-   **Request Body**: Follows the Google Pub/Sub push format, containing a Base64-encoded message payload.

## Events Consumed

-   **Topic**: `checkpoints-topic`
-   **Subscription**: `checkpoints-subscription` (configured as a push subscription pointing to this service).
-   **Action**: Upon receiving a message, it uses the `SaveCheckpointUseCase` to look up the shipment and persist the new checkpoint to the `checkpoints` table and update the `shipments` table.

## Current Implementation Notes & TODOs

-   **DLQ Missing**: The logic to handle messages for non-existent shipments currently only logs a warning. A `TODO` exists in the code to publish these messages to a Dead Letter Queue (DLQ).
-   **Entity Creation**: A `TODO` exists to refactor the creation of the `Checkpoint` entity within the use case.

## How to Run Tests

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e
```
