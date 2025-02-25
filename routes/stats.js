const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Statistics management
 */

/**
 * @swagger
 * /stats/summary:
 *   get:
 *     summary: Get a summary of income and expenses
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Summary of income and expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:
 *                   type: number
 *                 totalExpenses:
 *                   type: number
 *                 balance:
 *                   type: number
 */
router.get("/summary", authMiddleware, async (req, res) => {
  const totalIncome = await prisma.income.aggregate({
    where: { userId: req.userId },
    _sum: { amount: true },
  });

  const totalExpenses = await prisma.expense.aggregate({
    where: { userId: req.userId },
    _sum: { amount: true },
  });

  res.json({
    totalIncome: totalIncome._sum.amount || 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    balance: (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0),
  });
});

module.exports = router;