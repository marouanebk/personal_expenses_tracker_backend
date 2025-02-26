const populateData = require("./populateData");

const userId = 1; // Replace with the actual userId you want to use

populateData(userId)
  .then(() => {
    console.log("Data population complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error populating data:", error);
    process.exit(1);
  });