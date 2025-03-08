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
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /stats/transactions:
 *   get:
 *     summary: Retrieve both expenses and incomes
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: A list of expenses and incomes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 expenses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       note:
 *                         type: string
 *                       transactionType:
 *                         type: string
 *                       userId:
 *                         type: integer
 *                 incomes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       note:
 *                         type: string
 *                       transactionType:
 *                         type: string
 *                       userId:
 *                         type: integer
 */
router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const incomes = await prisma.income.findMany({
      where: {
        userId: req.userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);

    res.json({ expenses, incomes, totalExpenses, totalIncomes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics", authMiddleware, async (req, res) => {
  try {
    const { period = "Month", startDate, endDate } = req.query;

    // Input validation
    const validPeriods = ["Week", "Month", "Quarter", "Year"];
    if (period && !validPeriods.includes(period)) {
      return res.status(400).json({ error: "Invalid period" });
    }
    if (startDate && isNaN(new Date(startDate).getTime())) {
      return res.status(400).json({ error: "Invalid startDate" });
    }
    if (endDate && isNaN(new Date(endDate).getTime())) {
      return res.status(400).json({ error: "Invalid endDate" });
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({ error: "startDate must be before endDate" });
      }
    }

    const dateFilter = getDateRangeFilter(period, startDate, endDate);
    const prevDateFilter = getPreviousPeriodFilter(period, startDate, endDate);
    const months = period === "Year" ? 12 : 6;

    const [
      currentIncomeAggregate,
      currentExpenseAggregate,
      prevIncomeAggregate,
      prevExpenseAggregate,
      categoryDistribution,
      incomeExpenseChartData,
      monthlyTrendsData,
      cashExpenses,
      cardExpenses,
      topCategoriesRaw,

    ] = await Promise.all([
      prisma.income.aggregate({
        where: { userId: req.userId, date: dateFilter },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId: req.userId, date: dateFilter },
        _sum: { amount: true },
      }),
      prisma.income.aggregate({
        where: { userId: req.userId, date: prevDateFilter },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId: req.userId, date: prevDateFilter },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { userId: req.userId, date: dateFilter },
        _sum: { amount: true },
      }),
      getMonthlyIncomeExpenseData(req.userId, months),
      getMonthlyTrendsData(req.userId, months),
      prisma.expense.aggregate({
        where: { userId: req.userId, transactionType: 'CASH', date: dateFilter },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId: req.userId, transactionType: 'CARD', date: dateFilter },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { userId: req.userId, date: dateFilter },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } }, // Order by amount descending
        take: 3 // Limit to top 3
      }),
    ]);

    // Rest of the existing logic remains unchanged
    const currentIncome = currentIncomeAggregate._sum.amount || 0;
    const currentExpenses = currentExpenseAggregate._sum.amount || 0;
    const prevIncome = prevIncomeAggregate._sum.amount || 0;
    const prevExpenses = prevExpenseAggregate._sum.amount || 0;

    const currentBalance = currentIncome - currentExpenses;
    const savingsRate = currentIncome > 0 ? Math.round((currentBalance / currentIncome) * 100) : 0;

    const incomeChange = calculatePercentageChange(prevIncome, currentIncome);
    const expenseChange = calculatePercentageChange(prevExpenses, currentExpenses);

    const formattedCategoryData = categoryDistribution.map(item => ({
      category: item.category,
      amount: item._sum.amount || 0,
    }));

    const cashAmount = cashExpenses._sum.amount || 0;
    const cardAmount = cardExpenses._sum.amount || 0;
    const totalExpenses = cashAmount + cardAmount;

    const cashPercentage = totalExpenses > 0 ? Math.round((cashAmount / totalExpenses) * 100) : 0;
    const cardPercentage = totalExpenses > 0 ? Math.round((cardAmount / totalExpenses) * 100) : 0;

    const startDateObj = new Date(dateFilter.gte);
    const endDateObj = new Date(dateFilter.lte);
    const days = Math.max(1, Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)));

    const dailyIncome = Math.round(currentIncome / days);
    const dailySpending = Math.round(currentExpenses / days);

    const totalExpensesForCategories = topCategoriesRaw.reduce((acc, curr) => acc + (curr._sum.amount || 0), 0);


    const topCategories = topCategoriesRaw.map(item => ({
      category: item.category,
      amount: item._sum.amount || 0,
      percentage: totalExpensesForCategories > 0 
        ? Math.round((item._sum.amount / totalExpensesForCategories) * 100)
        : 0
    }));

    res.json({
      summary: {
        income: currentIncome,
        expenses: currentExpenses,
        balance: currentBalance,
        savingsRate,
        incomeChange,
        expenseChange,
      },
      categoryDistribution: formattedCategoryData,
      incomeExpenseChart: incomeExpenseChartData,
      monthlyTrends: monthlyTrendsData,
      paymentMethods: {
        cashAmount,
        cashPercentage,
        cardAmount,
        cardPercentage,
        dailyIncome,
        dailySpending,
      },
      topCategories: topCategories, 
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});


// Helper functions
function getDateRangeFilter(period, startDate, endDate) {
  const now = new Date();
  let start = new Date();
  
  if (startDate && endDate) {
    // Custom date range
    return {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }
  
  switch(period) {
    case "Week":
      start.setDate(now.getDate() - 7);
      break;
    case "Month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "Quarter":
      start.setMonth(now.getMonth() - 3);
      break;
    case "Year":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1); // Default to month
  }
  
  return {
    gte: start,
    lte: now
  };
}

function getPreviousPeriodFilter(period, startDate, endDate) {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end.getTime() - start.getTime();
    
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    
    const prevStart = new Date(prevEnd);
    prevStart.setTime(prevEnd.getTime() - duration);
    
    return {
      gte: prevStart,
      lte: prevEnd
    };
  }
  
  const now = new Date();
  let currentStart = new Date();
  let prevStart = new Date();
  let prevEnd = new Date();
  
  switch(period) {
    case "Week":
      currentStart.setDate(now.getDate() - 7);
      prevEnd = new Date(currentStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 7);
      break;
    case "Month":
      currentStart.setMonth(now.getMonth() - 1);
      prevEnd = new Date(currentStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setMonth(prevStart.getMonth() - 1);
      break;
    case "Quarter":
      currentStart.setMonth(now.getMonth() - 3);
      prevEnd = new Date(currentStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setMonth(prevStart.getMonth() - 3);
      break;
    case "Year":
      currentStart.setFullYear(now.getFullYear() - 1);
      prevEnd = new Date(currentStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setFullYear(prevStart.getFullYear() - 1);
      break;
    default:
      currentStart.setMonth(now.getMonth() - 1);
      prevEnd = new Date(currentStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setMonth(prevStart.getMonth() - 1);
  }
  
  return {
    gte: prevStart,
    lte: prevEnd
  };
}

function calculatePercentageChange(previous, current) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10; // Round to 1 decimal place
}

async function getMonthlyIncomeExpenseData(userId, monthsCount) {
  const now = new Date();
  const months = [];
  const incomeData = [];
  const expenseData = [];
  
  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    
    const monthName = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get total income for this month
    const monthlyIncome = await prisma.income.aggregate({
      where: {
        userId: userId,
        date: {
          gte: firstDay,
          lte: lastDay
        }
      },
      _sum: { amount: true }
    });
    
    // Get total expenses for this month
    const monthlyExpenses = await prisma.expense.aggregate({
      where: {
        userId: userId,
        date: {
          gte: firstDay,
          lte: lastDay
        }
      },
      _sum: { amount: true }
    });
    
    months.push(monthName);
    incomeData.push(monthlyIncome._sum.amount || 0);
    expenseData.push(monthlyExpenses._sum.amount || 0);
  }
  
  return {
    months: months,
    incomeData: incomeData,
    expenseData: expenseData
  };
}

async function getMonthlyTrendsData(userId, monthsCount) {
  const now = new Date();
  const months = [];
  const balanceData = [];
  const savingsRateData = [];
  
  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    
    const monthName = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get total income for this month
    const monthlyIncome = await prisma.income.aggregate({
      where: {
        userId: userId,
        date: {
          gte: firstDay,
          lte: lastDay
        }
      },
      _sum: { amount: true }
    });
    
    // Get total expenses for this month
    const monthlyExpenses = await prisma.expense.aggregate({
      where: {
        userId: userId,
        date: {
          gte: firstDay,
          lte: lastDay
        }
      },
      _sum: { amount: true }
    });
    
    const income = monthlyIncome._sum.amount || 0;
    const expenses = monthlyExpenses._sum.amount || 0;
    const balance = income - expenses;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
    
    months.push(monthName);
    balanceData.push(balance);
    savingsRateData.push(savingsRate);
  }
  
  return {
    months: months,
    balanceData: balanceData,
    savingsRateData: savingsRateData
  };
}

module.exports = router;
