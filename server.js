const express = require("express");
const cors = require("cors");
const sql = require("mssql");

const app = express();
const port = process.env.PORT || 8080; // Use the PORT environment variable if set, otherwise default to 8080

// Azure SQL connection configuration
const dbConfig = {
  user: "pauleen", // Azure SQL username
  password: "Vote1234", // Azure SQL password
  server: "votingsys.database.windows.net", // Azure SQL server name
  database: "votingDB", // Your database name
  options: {
    encrypt: true, // Use encryption
    trustServerCertificate: true, // Bypass SSL certificate validation
  },
};

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.send("App is running and healthy.");
});

// Route to get all votes
app.get("/votes", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig); // Connect to Azure SQL
    const result = await pool.request().query("SELECT * FROM Votes ORDER BY id DESC");
    res.json(result.recordset); // Return the query results
  } catch (err) {
    console.error("Error querying the database:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Route to create a new vote record
app.post("/votes", async (req, res) => {
  const { name, preferredLanguage } = req.body;

  // Validate input
  if (!name || !preferredLanguage) {
    return res.status(400).json({ message: "Name and preferred language are required." });
  }

  try {
    const pool = await sql.connect(dbConfig); // Connect to Azure SQL
    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("preferredLanguage", sql.NVarChar, preferredLanguage)
      .query("INSERT INTO Votes (name, preferredLanguage) VALUES (@name, @preferredLanguage)");

    res.status(201).json({
      message: "Vote successfully recorded",
      data: { name, preferredLanguage },
    });
  } catch (err) {
    console.error("Error inserting into the database:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
