import express from "express";
import bodyParser from "body-parser";

// postgreSQL module
import pg from "pg";

// allows us to access our passwords and other sensitive variables from the .env file
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

const itemsTable = "items";

const db = new pg.Client({
  user: process.env.PG_USERNAME,
  host: "localhost",
  // access the "permalist" database in postgreSQL
  database: "permalist",
  password: process.env.PG_PASSWORD,
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// variable to store all of the items
let items = [
  // { id: 1, title: "Buy milk" },
  // { id: 2, title: "Finish homework" },
];

async function getAllItems() {
  const result = await db.query(`SELECT * FROM ${itemsTable}`);
  console.log("getAllItems(): result = ", result);
  return result.rows;
}

// default home page route
app.get("/", async (req, res) => {
  items = await getAllItems();
  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  console.log("item = ", item);
  // error handling
  if (typeof item === "undefined") {
    // null check
    console.error(`Error (\'/add\' route): Body of the request does not contain a new item.`);
  } else {
    if (item.trim().length === 0) {
      // empty string
      console.error(`Error (\'/add\' route): Add a new item.`);
    } else {
      // add the new item to the items table
      try {
        const result = await db.query(`INSERT INTO ${itemsTable} (title) VALUES ($1)`, [item]);
        // items.push({ title: item });
      } catch(err){
        console.error(`Error adding `, item, ` to the ${itemsTable} table: `, err.stack)
      }
      
      // redirect back to the default route
      res.redirect("/");
    }
  }
});

app.post("/edit", (req, res) => {});

app.post("/delete", (req, res) => {});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
