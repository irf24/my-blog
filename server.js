/*----------required modules---------------*/
const express = require("express");
const parser = require("body-parser");
const path = require("path");
const mongoDB = require("mongodb");

const app = express(); //Server instance

/*-------------middlewares-----------------*/
app.use(parser.json());
app.use(express.static(path.join(__dirname, "/build"))); //path for serving static files

/*------------connect to mongodb------------*/
const withDB = async (operation, res) => {
  try {
    const client = await mongoDB.MongoClient.connect(
      "mongodb://localhost:27017",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    const db = client.db("my-blog");

    await operation(db); // handling db related requests

    client.close();
  } catch (err) {
    res.send(err);
  }
};

/*---------------Get article request---------------*/
app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name; //getting url parameters
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

/*----------------Upvote Article-------------------*/
app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name; //getting url parameters
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: { upvotes: articleInfo.upvotes + 1 },
      }
    );

    const updatedInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.send(updatedInfo);
  }, res);
});

/*-----------------Add comments------------------*/
app.post("/api/articles/:name/add-comment", async (req, res) => {
  withDB(async (db) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: { comments: articleInfo.comments.concat({ username, text }) },
      }
    );

    const updatedInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.send(updatedInfo);
  }, res);
});

/*-----------Routing all other requests to index page---------*/
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

/*------------assigning port----------------*/
app.listen(8000, () => {
  console.log("server is running on port 8000");
});
