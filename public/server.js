const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve your index.html if in /public

app.post("/share", (req, res) => {
  console.log("Received data:", req.body);
  // TODO: send email, save to DB, etc.
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
