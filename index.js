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
import url from 'url';

const db1 = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "password",
  database: "employeesystem",
});

dotenv.config();

const app = express();
app.use(fileUpload());

app.use(express.static('public'))
app.use('/images', express.static('images'));

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


function insertImage(createdOn, file, postId, fileType, res) {
  db1.query(
    "INSERT INTO images (createdOn, fileName, postId, imageType) VALUES (?,?,?,?)",
    [createdOn, file.name, postId, fileType],
    (err, imagesResult) => {
      if (err) {
        console.log(err);
      } else {
        const fileName = imagesResult.insertId + "." + fileType;
        // console.log("the id of the image is " + imagesResult.insertId + " the full name is " + fileName);

        file.mv(`public/images/${fileName}`, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send(err);
          }
    
          res.json({ fileName: file.name, filePath: `/images/${file.name}` });
        });
      }
    }
  );
}


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

function getPostsFromBoard(req, res, boardId, boardName) {
  // todo check that this user is autorhozed to see this board
  db1.query(
    "SELECT posts.id,posts.text,posts.createdOn,createdBy,name, images.id AS imageId, \
    images.imageType FROM posts \
    INNER JOIN users ON posts.createdBy=users.id LEFT JOIN images ON images.postId=posts.id WHERE boardId=? ORDER BY posts.createdOn",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        var postsHash = {};
        var imagesHash = {};
        
        let posts = new Array();
        
        Object.keys(result).forEach(function (key) { 
          // check in the id if it already exists in the hashtable
          var id = result[key].id;
          var text = result[key].text;
          var createdOn = result[key].createdOn;
          var createdBy = result[key].createdBy;
          var name = result[key].name;
          var imageId = result[key].imageId;
          var imageType = result[key].imageType;


          if (postsHash[id] === undefined) {
            postsHash[id] = {
              "id": id,
              "text": text,
              "createdOn": createdOn,
              "createdBy": createdBy,
              "name": name,
              images: new Array()
            }
            
            imagesHash[key] = {
              imageId, imageType
            }
              
            let info = postsHash[id];
            
            postsHash[id].images.push(imagesHash[key]);
            // console.log(id + " has been added.");
            
            posts.push(info);
          } else {
            var imageId = result[key].imageId;
            var imageType = result[key].imageType;
            imagesHash[key] = {
              imageId, imageType
            }
            postsHash[id].images.push(imagesHash[key]);
          }
        });
        
        if (req.url.indexOf('v=3') > 1) {
          let obj = { id: boardId, name: boardName, posts: posts };
          res.send(obj);
        } else if (req.url.indexOf('v=2') > 1) {
          res.send(posts);
        } else {
          res.send(result);
        }
      }
    }
  );
}

app.get("/boards/:id", (req, res) => {
  currentUser(req).then((user) => {
    // console.log(req.params)
    if (user == null) {
      res.status(401).json({ msg: "Not logged in" });
      console.log("Not logged in");
      return 0;
    }
    db1.query("SELECT * FROM boards WHERE boards.id=?;",
      [req.params.id],
      (err, result) => {
        if (err) {
          // console.log(err);
        } else {
          // if there is more than 0 rows execute 
          console.log(result);
          if (result.length > 0) {
            var boardId = result[0].id;
            var boardName = result[0].title;

            getPostsFromBoard(req, res, boardId, boardName);
          } else {
            // throw 404
            res.status(500).json({ msg: "Error" });
          }
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
  db1.query("DELETE FROM images WHERE postId = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      db1.query("DELETE FROM posts WHERE id = ?", id, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send(result);
        }
      });
    }
  });
});


app.delete("/deleteImage/:id", (req, res) => {
  const id = req.params.id;
  db1.query("DELETE FROM images WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});


app.get("/boardsSorted", (req, res) => {
  // console.log(req.url);

  const queryObject = url.parse(req.url, true).query;
  // console.log(queryObject.order);

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

    var file, fileType;
    if (req.files !== null) {
      file = req.files.file;
      fileType = file.name.split('.')[1].toLowerCase();
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
      (err, postsResult) => {
        if (err) {
          console.log(err);
        } else {
          if (req.files !== null) {
              var postId = postsResult.insertId;
               // insert image - check if an image was even added
              insertImage(createdOn, file, postId, fileType, res);
              // imagePost(db1, createdOn, file.name, postsResult.insertId, fileType);
          }
        }
      }
    );
  });
});

app.post("/uploadImage", (req, res) => {
  currentUser(req).then((user) => {
    if (user == null) {
      res.status(404).json({ msg: "Not logged in" });
      console.log("Not logged in");
      return 0;
    }
    
    // throw an exception if we dont get a error
    if (req.files === null) {
      return res.status(500).send("Image not found.");
    } 

    var file = req.files.file;
    var fileType = file.name.split('.')[1].toLowerCase();
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    
    today = yyyy + "-" + mm + "-" + dd;

    const createdOn = today;
    const postId = req.body.postId;
    
    if (postId === null) {
      return res.status(500).send("Post id not found.");
    }

    insertImage(createdOn, file, postId, fileType, res);
  });
});

app.listen(5000, () => console.log("Server running at port 5000"));
