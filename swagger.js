const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Personal Expense Tracker API",
      version: "1.0.0",
      description: "API documentation for the Personal Expense Tracker backend",
    },
    servers: [{ url: "http://localhost:4000" }],
  },
  apis: ["./routes/*.js"], // Points to all route files
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger Docs available at http://localhost:4000/api-docs");
};

module.exports = swaggerDocs;
