const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { ObjectID } = require("bson");
const app = express();
const port = process.env.PORT || 5000;

// Middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9syuk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    // All Collections
    const productCollection = client
      .db("manufacturer-website")
      .collection("products");

    const orderCollection = client
      .db("manufacturer-website")
      .collection("orders");

    const userCollection = client
      .db("manufacturer-website")
      .collection("users");

    //get all products
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);
    });

    //get one particular product
    app.get("/item/:id", async (req, res) => {
      const itemId = req.params.id;
      const query = { _id: ObjectId(itemId) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    //get all the orders
    app.get("/orders", async (req, res) => {
      const result = await orderCollection.find({}).toArray();
      res.send(result);
    });

    //add order in the db
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    //get one orders
    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    // Get one user
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      if (email) {
        const query = { email: email };
        const result = await userCollection.findOne(query);
        res.send(result);
      }
    });

    // ----------------
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From GearX Manufacture");
});

app.listen(port, () => {
  console.log(`GearX Manufacture app listening on port ${port}`);
});
