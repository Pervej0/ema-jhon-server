const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sjbgh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

      // inser order details-
      app.post("/order", async (req, res) => {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.json(result);
        res.send(result);
      });

      res.send({ count, products });
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
