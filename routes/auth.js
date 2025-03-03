const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET;

const authMiddleware = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 */
router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  // Input validation
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { fullName, email, password: hashedPassword },
    });

    const token = jwt.sign({ userId: user.id, fullName: user.fullName, email: user.email }, SECRET, { expiresIn: "7d" });
    res.json({ message: "User registered successfully", token });
  } catch (error) {
    if (error.code === "P2002") { // Prisma unique constraint violation
      return res.status(400).json({ error: "User already exists" });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, fullName: user.fullName, email: user.email }, SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user full name and/or email
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid input or email in use
 *       401:
 *         description: Unauthorized
 */
router.put("/profile", authMiddleware, async (req, res) => {
  const { fullName, email } = req.body;
  const userId = req.userId;

  // Input validation
  if (!fullName && !email) {
    return res.status(400).json({ error: "At least one field (fullName or email) must be provided" });
  }
  if (email && (typeof email !== "string" || !email.includes("@"))) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Generate a new token with updated user info
    const token = jwt.sign({ userId: user.id, fullName: user.fullName, email: user.email }, SECRET, { expiresIn: "7d" });
    res.json({ message: "Profile updated successfully", token });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email already in use" });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /auth/password:
 *   put:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid current password
 */
router.put("/password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  // Input validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both currentPassword and newPassword are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
