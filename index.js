import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import db from "./config/Database.js";
import router from "./routes/index.js";
import mysql from "mysql";
import Users from "./models/UserModel.js";
import { currentUser } from "./controllers/Users.js";

const db1 = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "password",
  database: "employeesystem",
});

dotenv.config();
const app = express();

try {
  await db.authenticate();
  console.log("Database Connected...");
} catch (error) {
  console.error(error);
}

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());
app.use(express.json());
app.use(router);

app.post("/create", (req, res) => {
  currentUser(req).then((user) => {
    if (user == null) {
      res.status(404).json({ msg: "Not logged in" });
      console.log("Not logged in");
      return 0;
    }

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy + '-' + mm + "-" + dd;

    const createdBy = user.id;
    const createdOn = today;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const title = req.body.title;
        
    db1.query(
      "INSERT INTO boards (createdBy, createdOn, firstName, lastName, title) VALUES (?,?,?,?,?)",
      [createdBy, createdOn, firstName, lastName, title],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send("Values inserted");
        }
      }
    );
  });
});

app.get("/boards", (req, res) => {
  currentUser(req).then((user) => {
    if (user == null) {
      res.status(404).json({ msg: "Not logged in" });
      console.log("Not logged in");
      return 0;
    }

    let sql = `SELECT * FROM boards WHERE createdBy=${user.id}`;
    // role 2 is an admin that can see all users post
    if (user.role == 2) {
      sql = `SELECT boards.*, users.name AS createdByName FROM boards INNER JOIN users ON boards.createdBy=users.id`;
    }

    db1.query(sql, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    });
  });
});

app.put("/update", (req, res) => {
  const id = req.body.id;
  const wage = req.body.wage;
  db1.query(
    "UPDATE boards SET wage = ? WHERE id = ?",
    [wage, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});
app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  db1.query("DELETE FROM boards WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/boardsSorted", (req, res) => {
  console.log(req.url);

  const queryObject = url.parse(req.url, true).query;
  console.log(queryObject.order);

  let orderType = "ASC";
  if (queryObject.order == "true") {
    orderType = "ASC";
  } else {
    orderType = "DESC";
  }

  db1.query(
    "SELECT * FROM boards ORDER BY name " + orderType,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.listen(5000, () => console.log("Server running at port 5000"));
