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
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId },
    });
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
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
  const { description, category, amount, date, note, transactionType } = req.body;

  // Input validation
  if (!description || !category || !amount || !date || !transactionType) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const validCategories = ["SHOPPING", "FOOD", "TRANSPORT", "ENTERTAINMENT", "BILLS", "OTHER"];
  if (!validCategories.includes(category.toUpperCase())) {
    return res.status(400).json({ error: "Invalid category" });
  }
  const validTransactionTypes = ["CASH", "CARD"];
  if (!validTransactionTypes.includes(transactionType)) {
    return res.status(400).json({ error: "Invalid transaction type" });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }
  if (isNaN(new Date(date).getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        description,
        category: category.toUpperCase(),
        amount,
        date: new Date(date).toISOString(),
        note,
        transactionType,
        userId: req.userId,
      },
    });
    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
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

  // Input validation
  if (!Number.isInteger(parseInt(id, 10))) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    if (expense.userId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.expense.delete({ where: { id: parseInt(id, 10) } });
    res.json({ message: "Expense deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;