# AMP — WII Access Management Portal

Access Management Portal for the Wildlife Institute of India (WII).

## Architecture

Frontend -> REST API -> Express Backend -> Authentication/Authorization/Validation -> Services -> Repositories -> MySQL/MariaDB

## Core Rule

The frontend is a presentation layer only.

Authentication, authorization, validation, workflow decisions, permissions, users, roles, requisitions and master data are authoritative on the backend/database.

## Development

npm ci
npm run dev

## Validation

npm run lint
npm test
npm run build
npm audit

## Database

npm run db:migrate

Real credentials, passwords, API keys and secrets must never be committed to Git.
