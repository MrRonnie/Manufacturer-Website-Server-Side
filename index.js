const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

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

    //get all products
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);
    });

    //get one particular product
    app.get("/item/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const item = await productCollection.findOne(query);
      res.send(item);
    });

    // get all the orders
    app.get("/orders", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await orderCollection.find({}).toArray();
      res.send(result);
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
