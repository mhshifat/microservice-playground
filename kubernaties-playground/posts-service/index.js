const express = require("express");
const cors = require("cors");

const app = express();
app.use([
  cors(),
]);

app.get("/posts", (req, res) => res.status(200).json({
  success: true,
  data: []
}));

app.listen(8000, () => console.log(`Server is running on ${8000}`));