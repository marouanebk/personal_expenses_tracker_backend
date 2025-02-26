const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const faker = require("faker");

const categories = ["SHOPPING", "FOOD", "TRANSPORT", "ENTERTAINMENT", "BILLS", "OTHER"];
const transactionTypes = ["CASH", "CARD"];

async function populateData(userId) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 4);

  for (let i = 0; i < 100; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(Math.random() * 120));

    const incomeData = {
      description: faker.commerce.productName(),
      amount: parseFloat(faker.commerce.price()),
      date: date,
      note: faker.lorem.sentence(),
      transactionType: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      userId: userId,
    };

    const expenseData = {
      description: faker.commerce.productName(),
      category: categories[Math.floor(Math.random() * categories.length)],
      amount: parseFloat(faker.commerce.price()),
      date: date,
      note: faker.lorem.sentence(),
      transactionType: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      userId: userId,
    };

    await prisma.income.create({ data: incomeData });
    await prisma.expense.create({ data: expenseData });
  }

  console.log("Database populated with 100 instances of Income and Expense data.");
}

module.exports = populateData;