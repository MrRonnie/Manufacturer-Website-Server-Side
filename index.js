const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

    const feedbackCollection = client
      .db("manufacturer-website")
      .collection("feedbacks");

    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      console.log(order);
      const price = order.totalPrice;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    //get all products
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);
    });

    //add new product in db
    app.post("/product", async (req, res) => {
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });

    // delete one product from the db
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
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

    //delete one order
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    //get one particular order for payment
    app.get("/oneOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });

    // update one order after payment
    app.put("/oneOrder/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "Pending",
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const result = await orderCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // update status to Shipped
    app.put(
      "/updateToShipped/:id",

      async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: { status: "Shipped" },
        };
        const result = await orderCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      }
    );
    //create JWT and add users to the userCollection
    app.put("/token", async (req, res) => {
      const email = req.query.email;
      const token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const filter = { email: email };
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          email: email,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send({ token });
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

    //to update user's profile
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const updatedInfo = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: updatedInfo,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    //to patch or update one user (to set admin)
    app.patch("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    //to get all the users
    app.get("/users", async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });

    //to get all the feedbacks
    app.get("/feedbacks", async (req, res) => {
      const result = await feedbackCollection.find({}).toArray();
      res.send(result);
    });

    //to add new feedback
    app.post("/feedbacks", async (req, res) => {
      const review = req.body;
      const result = await feedbackCollection.insertOne(review);
      res.send(result);
    });

    // to get one user to check if admin or not
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role === "admin") {
        res.send(true);
      } else {
        res.send(false);
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
