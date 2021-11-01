const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const e = require("express");
const { query } = require("express");
var admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// firebase server admin initialization

var serviceAccount = require("./ema-jhon-4d7bd-firebase-adminsdk-zrw3g-d4edaa2aff.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// database informati
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sjbgh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const verifyToken = async (req, res, next) => {
  const authorize = req.headers.authorization.startsWith("bearer");
  console.log(authorize);
  if (authorize) {
    const idToken = req.headers.authorization.split(" ")[1];
    try {
      const decodeUser = await admin.auth().verifyIdToken(idToken);
      req.decodeUserEmail = decodeUser.email;
    } catch {
      //
    }
  }
  next();
};

const run = async () => {
  try {
    await client.connect();
    const database = client.db("products_Db");
    const productCollection = database.collection("products_item");
    const orderCollection = database.collection("order_item");

    // get products-

    app.get("/products", async (req, res) => {
      const cursor = productCollection.find({});
      const count = await cursor.count();
      const page = req.query.page;
      const perPageItem = parseInt(req.query.perPage);
      // console.log("pro", page, perPageItem);
      let products;
      if (page) {
        products = await cursor
          .skip(perPageItem * page)
          .limit(perPageItem)
          .toArray();
      } else {
        products = await cursor.toArray();
      }

      // post specific product
      app.post("/products/keys", async (req, res) => {
        const keys = req.body;
        const query = { key: { $in: keys } };
        const products = await productCollection.find(query).toArray();
        res.json(products);
        // console.log(products);
        // res.send(result);
      });

      // insert order details-
      app.post("/order", async (req, res) => {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.json(result);
        res.send(result);
      });

      res.send({ count, products });
    });

    // get order data form db

    app.get("/order/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log("deee", req.decodeUserEmail, email);
      if (req.decodeUserEmail === email) {
        const query = { email: email };
        const result = await orderCollection.find(query).toArray();
        res.send(result);
      } else {
        res.status(401).json({ message: "user not authorised" });
      }
    });
  } finally {
  }
};

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.listen(port, () => {
  console.log("Server is running on port: ", port);
});
