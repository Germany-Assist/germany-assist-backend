# Germany Assist Backend

Germany Assist Backend is the core backend API powering the Germany Assist platform — a place to connect with employers, promote your professional services, and start your career.  
It provides secure authentication, payments, timeline-based interactions, role-driven access management, and a complete logging and error-handling system.

---

## 🧩 Tech Stack

- **Runtime:** Node.js (Express)
- **ORM:** Sequelize (PostgreSQL)
- **Cache:** Redis
- **Auth:** JWT (Access + Refresh Tokens via Cookies)
- **Payments:** Stripe (test and live modes supported)
- **Logging:** Winston + Morgan
- **Testing:** Node.js native test runner + Sinon (stubbing) + Supertest (E2E)
- **Containerization:** Docker (planned for future deployment)

---

## ⚙️ Core Features

### 🔹 1. Timelines

- Each **service creation** automatically generates a **timeline**.
- Every service must always have **one active timeline**.
- Older timelines can be **archived** when new ones are created.
- Clients who purchase a service gain access to its timeline, allowing them to:
  - View content and posts.
  - Interact with the service provider.
  - Communicate with other users linked to that service.

---

### 🔹 2. Orders

- Orders are created:
  1. **Automatically** when a client buys a service (free or paid).
  2. **Automatically** by background workers when a payment is confirmed.
- Order states:
  1. 🟢 **Paid** – Payment confirmed.
  2. 🔵 **Refunded** – Payment returned to client.
  3. 🟠 **Fulfilled** – Service provider completed the service.
  4. 🟣 **Completed** – Provider received payment for the fulfilled service.

---

### 🔹 3. Roles and Permissions

- Supports **roles** and **permissions** for fine-grained access control.
- Permissions can be **assigned or revoked** based on authority and ownership.
- Users cannot assign permissions higher than their own.
- Role templates define default permissions for entities like admin, worker, and client.

---

### 🔹 4. Updates & Field Restrictions

- Certain fields like **email**, **reviews**, **phone numbers**, and **service descriptions** have restricted updates.
- Some fields can be **frozen** during ongoing transactions.
- Service updates may temporarily **withdraw approval** until reviewed.

---

### 🔹 5. Upload Assets Management

- Uploads are tracked in an **assets table**.
- Assets are linked to entities such as services or profiles.
- If an asset link is dropped, a worker will delete the file later.
- Rate limits or bandwidth restrictions may apply per uploader entity.

---

### 🔹 6. Summary Table

| Feature                   | Trigger / Action                      | Behavior Description         |
| ------------------------- | ------------------------------------- | ---------------------------- |
| **Timeline Creation**     | New service created                   | Auto-creates active timeline |
| **Timeline Archiving**    | Service updated or recreated          | Archives old timeline        |
| **Order Creation**        | Service purchase or confirmed payment | Generates linked order       |
| **Order State Update**    | Payment, refund, fulfillment          | Updates order state          |
| **Permission Management** | Admin or authorized user action       | Checked against template     |

---

## 🔐 Authentication

### Access & Refresh Tokens

- Uses **JWT** with access and refresh tokens.
- **Access tokens** are short-lived for API access.
- **Refresh tokens** are long-lived, stored securely in HTTP-only cookies in case of production its HTTPS.
- Middleware automatically validates and decrypts tokens into `req.auth`.

---

## 🧰 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Redis

Install and run Redis; add connection variables to .env.

### 3. Setup PostgreSQL

Install, create a database, and add connection variables to .env.

### 4. Environment File

Create dev.env using dev.env.txt as a template.
Use test.env for testing environments.

### 5. When all ready

Run the script `npm run dbInit`

---

## 🏃 Scripts

### Development

```
npm run dev
```

Runs the app in watch mode with dev.env.

### Database Initialization

```
npm run dbInit
```

1. Creates schema

2. Seeds initial data

3. Applies constraints

⚠️ Deletes existing data; only use in dev or test.

- super important since it seeds the categories and the permissions and creates the root account
- root account password is in the seed file

### Testing

```
npm test
npm run workflowTest
```

- Pre scripts run automatically.
- Supports Node test runner, Sinon, Supertest.

### Export & Seed

```
npm run export # Export DB to JSON
npm run seed # Seed DB from exported JSON
```

- Default path: ./database/seeds/data

### Test Data Seeding

To populate your local database with comprehensive test data for development and testing:

```
npm run seed:test
```

**Prerequisites:**
- Database must be initialized first (run `npm run dbInit` if you haven't already)
- This will create test data in your existing database (does not drop existing data)

**Note:** 
- All other test users have the password: `Test123!@#`
- Data is randomly generated but respects foreign key relationships
- Service-related data is emphasized as requested
- This script is safe to run multiple times (it will add more data each time, but the default user will only be created once)

---

## 🪵 Logging

### Loggers

1. HTTP Logger: Tracks requests/responses via Morgan.

2. Error Logger: Logs errors; shows stack in dev, minimal info in production.

3. Debug Logger: For development; disabled in production.

4. Info Logger: General information like server start/shutdown.

---

## 🧱 Error Handling

- Centralized middleware with custom AppError class:

```js
import { AppError } from "./utils/error.class.js";
throw new AppError(404, "Bad route", true);
```

```js
 throw new AppError([status code],[message], [operational:true/false],[public message]);
```

- When handling errors in the error middleware if the error has public message only the public message will be sent to the user.

## 💳 Payments (Stripe)

`/pay` endpoint takes service ID to create payment intents and get client secrets.

**Local testing:**

```bash
stripe listen --forward-to localhost:3000/payments/webhook
stripe payment_intents confirm pi_xxx --payment-method pm_card_visa
```

- Dont forget to install stripe cli and provide the secret key and the webhook secret

# File Uploading

**Local testing:**

## 🧱 LocalStack + AWS CLI Setup (S3 Persistence)

This guide explains how to set up **LocalStack** using **Docker** to emulate AWS S3 locally, with data persistence between restarts.

Please note that i wrote this for bash/linux system some commands might be different on windows.

---

LocalStack is a fully functional local AWS cloud stack that allows you to develop and test AWS applications locally — no need for a real AWS account.

In this setup:

- We’ll use **Docker** to run LocalStack.
- Use **AWS CLI** to interact with it.
- Store S3 data persistently in a Docker volume.

---

## 🧩 Step 1 — Install AWS CLI

```bash
sudo apt install awscli -y
```

Or windows equivalent

## 🐳 Step 2 — Run LocalStack in Docker

```bash
docker volume create localstack-data
```

And then run the container

```bash
docker run -d -it \
  -v localstack-data:/localstack/data \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  -e SERVICES=s3 \
  -e DATA_DIR=/localstack/data \
  --restart always \
  localstack/localstack
```

## 🔑 Step 3 — Set Dummy AWS Credentials

```
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
```

## 🪣 Step 4 — Create an S3 Bucket

```
aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket
```

Please note that the community edition of localstack might persist data correctly, you can use a Community-Driven Alternative :

```
version: "3.8"
services:
  localstack:
    image: gresau/localstack-persist:4
    container_name: localstack
    ports:
      - "4566:4566"
    environment:
      - PERSIST_DEFAULT=0
      - PERSIST_S3=1
      - PERSIST_DYNAMODB=1
      - PERSIST_FORMAT=json
      - PERSIST_FREQUENCY=10
    volumes:
      - ./localstack-data:/persisted-data
    restart: unless-stopped
volumes:
  localstack-data:
```

## 🚀 New Feature: Liam ERD

We have added **Liam ERD** to the project!  
Liam ERD is a simple and powerful tool that generates clean, easy-to-read ER diagrams directly from your database schema.

### ▶️ How to Run Liam ERD

To start the ERD viewer locally, just run:

```sh
npx serve liam/dist/
```
