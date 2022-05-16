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

    const name = req.body.name;
    const age = req.body.age;
    const country = req.body.country;
    const position = req.body.position;
    const wage = req.body.wage;
    const createdBy = user.id;

    db1.query(
      "INSERT INTO boards (name, age, country, position, wage, createdBy) VALUES (?,?,?,?,?,?)",
      [name, age, country, position, wage, createdBy],
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
