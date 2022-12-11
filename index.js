import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import db from "./config/Database.js";
import router from "./routes/index.js";
import mysql from "mysql";
import Users from "./models/UserModel.js";
import { currentUser } from "./controllers/Users.js";
import fileUpload from "express-fileupload";

const db1 = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "password",
  database: "employeesystem",
});

dotenv.config();

const app = express();
app.use(fileUpload());

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

// create BOARD
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

    today = yyyy + "-" + mm + "-" + dd;

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

app.post("/createPost", (req, res) => {
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

    today = yyyy + "-" + mm + "-" + dd;

    const createdBy = user.id;
    const createdOn = today;
    const text = req.body.postText;
    const boardId = req.body.boardId;
    
    // insert post
    db1.query(
      "INSERT INTO posts (text, createdOn, boardId, createdBy) VALUES (?,?,?,?)",
      [text, createdOn, boardId, createdBy],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send("Values inserted, the post id is: " + result.insertId);
          console.log("Values inserted, the post id is: " + result.insertId);

          imagePost(db1, createdOn, "hardcodedimagename.png", result.insertId);
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

    // let sql = `SELECT * FROM boards WHERE createdBy=${user.id}`;
    let sql = `SELECT  boards.*, users.name, a.boardId, postCount FROM
    (SELECT boardId, COUNT(*) AS postCount FROM posts GROUP BY boardId) as a
      right join boards on boards.id = a.boardId
      INNER JOIN users ON boards.createdBy=users.id WHERE boards.createdBy=${user.id};`;

    // role 2 is an admin that can see all users post
    if (user.role == 2) {
      // sql = `SELECT boards.*, users.name AS createdByName FROM boards INNER JOIN users ON boards.createdBy=users.id`;
      sql = `
      SELECT  boards.*, users.name, a.boardId, postCount FROM
        (SELECT boardId, COUNT(*) AS postCount FROM posts GROUP BY boardId) as a
          right join boards on boards.id = a.boardId
          INNER JOIN users ON boards.createdBy=users.id
          `;
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

app.get("/boards/:id", (req, res) => {
  currentUser(req).then((user) => {
    console.log(req.params)
    if (user == null) {
      res.status(401).json({ msg: "Not logged in" });
      console.log("Not logged in");
      return 0;
    }
    
    // todo check that this user is autorhozed to see this board
    db1.query(
      "SELECT posts.id,text,image,createdOn,createdBy,name FROM posts INNER JOIN users ON posts.createdBy=users.id WHERE boardId=?",
      [req.params.id],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log(req.params)
          res.send(result);
        }
      }
    );
  });
});

app.put("/edit", (req, res) => {
  const id = req.body.id;
  const text = req.body.text;
  db1.query(
    "UPDATE posts SET text = ? WHERE id = ?",
    [text, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );

  // const id = req.params.id;
  // db1.query("DELETE FROM boards WHERE id = ?", id, (err, result) => {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     res.send(result);
  //   }
  // });
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

app.delete("/deletePost/:id", (req, res) => {
  const id = req.params.id;
  db1.query("DELETE FROM posts WHERE id = ?", id, (err, result) => {
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

function imagePost(database, createdOn, fileName, postId, imageType) {
  // insert image - check if an image was even added
  database.query(
    "INSERT INTO images (createdOn, fileName, postId, imageType) VALUES (?,?,?,?)",
    [createdOn, fileName, postId, imageType],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        // console.log("Values inserted, the id of the image is: " + result.insertId);
      }
    }
  );
}

app.post("/upload", (req, res) => {
  currentUser(req).then((user) => {
    if (user == null) {
      res.status(404).json({ msg: "Not logged in" });
      console.log("Not logged in");
      return 0;
    }

    if (req.files !== null) {
      var file = req.files.file;
      var fileType = file.name.split('.')[1].toLowerCase();
    }
    
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy + "-" + mm + "-" + dd;

    const createdBy = user.id;
    const createdOn = today;
    const text = req.body.postText;
    const boardId = req.body.boardId;
    
    // insert post
    db1.query(
      "INSERT INTO posts (text, createdOn, boardId, createdBy) VALUES (?,?,?,?)",
      [text, createdOn, boardId, createdBy],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          if (req.files !== null) {
              file.mv(`client/public/uploads/${file.name}`, (err) => {
              if (err) {
                console.error(err);
                return res.status(500).send(err);
              }
        
              res.json({ fileName: file.name, filePath: `/uploads/${file.name}` });
      
              imagePost(db1, createdOn, file.name, result.insertId, fileType);
            });
          }
        }
      }
    );

     
  });
});

app.listen(5000, () => console.log("Server running at port 5000"));
