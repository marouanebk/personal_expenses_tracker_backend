const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management
 */

/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: Retrieve a list of expenses
 *     tags: [Expenses]
 *     responses:
 *       200:
 *         description: A list of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   note:
 *                     type: string
 *                   userId:
 *                     type: integer
 */
router.get("/", authMiddleware, async (req, res) => {
  const expenses = await prisma.expense.findMany({
    where: { userId: req.userId },
  });
  res.json(expenses);
});

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expense created successfully
 */
router.post("/", authMiddleware, async (req, res) => {
  const { description, category, amount, date, note , transactionType } = req.body;

  const expense = await prisma.expense.create({
    data: { description, category, amount, date, note,transactionType,  userId: req.userId },
  });

  res.json(expense);
});

/**
 * @swagger
 * /expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       403:
 *         description: Unauthorized
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense || expense.userId !== req.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await prisma.expense.delete({ where: { id } });
  res.json({ message: "Expense deleted" });
});

module.exports = router;