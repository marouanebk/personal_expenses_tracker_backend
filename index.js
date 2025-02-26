require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const swaggerDocs = require("./swagger");

const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expense");
const incomeRoutes = require("./routes/income");
const statsRoutes = require("./routes/stats");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/auth", authRoutes);
app.use("/expenses", expenseRoutes);
app.use("/incomes", incomeRoutes);
app.use("/stats", statsRoutes);

// Setup Swagger
swaggerDocs(app);

app.listen(4000, '0.0.0.0', () => console.log(`Server running on port 4000`));

