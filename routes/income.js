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
  const incomes = await prisma.income.findMany({
    where: { userId: req.userId },
  });
  res.json(incomes);
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
  const { description, amount, date, note } = req.body;

  const income = await prisma.income.create({
    data: { description, amount, date, note, userId: req.userId },
  });

  res.json(income);
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

  const income = await prisma.income.findUnique({
    where: { id },
  });

  if (!income || income.userId !== req.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await prisma.income.delete({ where: { id } });
  res.json({ message: "Income deleted" });
});

module.exports = router;