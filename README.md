# Personal Expense Tracker API

This is the backend for the Personal Expense Tracker application. It is built using Node.js, Express, and Prisma, and provides a RESTful API for managing personal expenses.

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)

## Installation

1. Clone the repository:

\`\`\`sh
git clone https://github.com/marouanebk/personal_expenses_tracker_backend
cd expense-tracker-backend
\`\`\`

2. Install the dependencies:

\`\`\`sh
npm install
\`\`\`

## Environment Variables

Create a \`.env\` file in the root directory of the project and add the following environment variables:

\`\`\`properties
DATABASE_URL="postgresql://postgres@localhost:5432/expense_tracker?schema=public"
JWT_SECRET=JWT_SECRET_KEY

EMAIL_USER=YOUREMAILHERE
EMAIL_PASSWORD=xtda nzmo wpfp lcbs
\`\`\`

## Database Setup

1. Make sure you have PostgreSQL installed and running on your machine.
2. Create a new database named \`expense_tracker\`.
3. Run the Prisma migrations to set up the database schema:

\`\`\`sh
npx prisma migrate dev --name init
\`\`\`

## Running the Application

1. Start the server:

\`\`\`sh
npm start
\`\`\`

The server will start on port \`4000\` by default. You can change the port by setting the \`PORT\` environment variable in the \`.env\` file.

## API Documentation

The API documentation is available at \`http://localhost:4000/api-docs\` once the server is running. It is generated using Swagger.


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
