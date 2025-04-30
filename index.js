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
    console.error(
      `Error (\'/add\' route): Body of the request does not contain a new item.`
    );
  } else {
    if (item.trim().length === 0) {
      // empty string
      console.error(`Error (\'/add\' route): Add a new item.`);
    } else {
      // add the new item to the items table
      try {
        const result = await db.query(
          `INSERT INTO ${itemsTable} (title) VALUES ($1)`,
          [item]
        );
      } catch (err) {
        console.error(
          `Error adding `,
          item,
          ` to the ${itemsTable} table: `,
          err.stack
        );
      }

      // redirect back to the default route
      res.redirect("/");
    }
  }
});

// route is triggered once the end user click the checkmark icon after modifying an item
app.post("/edit", async (req, res) => {
  console.log('\'edit\' route: req.body = ', req.body);
  let itemId = req.body.updatedItemId;
  let newText = req.body.updatedItemTitle;

  if(req.body.hasOwnProperty("updatedItemId") && req.body.hasOwnProperty("updatedItemTitle")){
    if(newText.trim().length === 0){
      // don't update an item with an empry string
      console.error(`Error (\'/edit\' route): Can't modify an item with an empty string.`);
    } else {
      // variable to store the result of the update query
      let result;
      try {
        // locate the item with id = id in the database and update it
        result = db.query(`UPDATE ${itemsTable} SET title = ($1) WHERE id = ($2)`, [newText, itemId]);
      } catch(err){
        console.error(`(\'/edit\' route) Cannot update item with id = ${itemId}: `, err.stack);
      }
      
    }
    // redirect to the default get route
    res.redirect("/");

  } else {
    // for some reason, either the id, title, or both were not passed in the body of the request
    console.error(
      `Error (\'/edit\' route): Body of the request does not contain a new item.`
    );
  }
});

// route is triggered once the end user checks off the box (to the left of the item)
app.post("/delete", async (req, res) => {

  console.log('\'delete\' route: req.body = ', req.body);
  let stringId = req.body.deleteItemId;
  // null
  if(req.body.hasOwnProperty("deleteItemId")){
    // convert the id into a number (it's a string by default)
    let itemId = Number(stringId);

    // delete the item with id = itemId from the items table
    // variable that stores the result of the query
    let result;
    try {
      result = db.query(`DELETE FROM ${itemsTable} WHERE id = ($1)`, [itemId]);

    } catch (err){
      console.error(`(\'/delete\' route) Cannot delete item with id = ${itemId}: `, err.stack)
    }

    // redirect to the default GET route
    res.redirect("/");

  } else {
    // for some reason, the id of the item was not passed in the body of the request
    console.error(
      `Error (\'/delete\' route): Body of the request does not contain an id for an item.`
    );
  }


});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
