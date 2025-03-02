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

// commit 
app.use(cors());
app.use(express.json());

// API Routes
app.use("/auth", authRoutes);
app.use("/expenses", expenseRoutes);
app.use("/incomes", incomeRoutes);
app.use("/stats", statsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Setup Swagger
swaggerDocs(app);

const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));


process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});

