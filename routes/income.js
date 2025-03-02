const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Incomes
 *   description: Income management
 */

/**
 * @swagger
 * /incomes:
 *   get:
 *     summary: Retrieve a list of incomes
 *     tags: [Incomes]
 *     responses:
 *       200:
 *         description: A list of incomes
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
    const incomes = await prisma.income.findMany({
      where: { userId: req.userId },
    });
    res.json(incomes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /incomes:
 *   post:
 *     summary: Create a new income
 *     tags: [Incomes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
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
 *         description: Income created successfully
 */

router.post("/", authMiddleware, async (req, res) => {
  const { description, amount, date, note, transactionType } = req.body;

  // Input validation
  if (!description || !amount || !date || !transactionType) {
    return res.status(400).json({ error: "Missing required fields" });
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
    const income = await prisma.income.create({
      data: {
        description,
        amount,
        date: new Date(date).toISOString(),
        note,
        transactionType,
        userId: req.userId,
      },
    });
    res.json(income);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /incomes/{id}:
 *   delete:
 *     summary: Delete an income
 *     tags: [Incomes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Income deleted successfully
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
    const income = await prisma.income.findUnique({
      where: { id: parseInt(id, 10) }, // Ensure integer parsing
    });

    if (!income) {
      return res.status(404).json({ error: "Income not found" });
    }
    if (income.userId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.income.delete({ where: { id: parseInt(id, 10) } });
    res.json({ message: "Income deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;