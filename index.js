require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lb3rxqj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const usersCollection = client.db("musicLand").collection("users");
    const classCollection = client.db("musicLand").collection("class");
    const cartCollection = client.db("musicLand").collection("cart");

    // users related apis
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/instructors", async (req, res) => {
      const query = { role: "instructor" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/role", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // cart api

    app.get("/carts", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.findOne(query);
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const item = req.body;
      const query = { email: item.email, classId: item.classId };
      const existingItem = await cartCollection.findOne(query);
      if (existingItem) {
        return res.send({ message: "Class already exists" });
      }
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    // Delete  classes from the cart
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // Handle Google sign-in
    app.post("/users/google", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Get all new classes
    app.get("/classes", async (req, res) => {
      try {
        const result = await classCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error retrieving new classes:", error);
        res.status(500).send("Error retrieving new classes");
      }
    });

    app.get("/approveClass", async (req, res) => {
      const query = { status: "approved" };
      const result = await classCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/class", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await classCollection.find(query).toArray();
      res.send(result);
    });

    // Create a new class
    app.post("/addClass", async (req, res) => {
      const newClass = req.body;
      try {
        const result = await classCollection.insertOne(newClass);
        res.send(result);
      } catch (error) {
        console.error("Error creating new class:", error);
        res.status(500).send("Error creating new class");
      }
    });

    // Send feedback for a class
    app.post("/classes/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const feedback = req.body.feedback;
      const updateDoc = {
        $set: {
          feedback: feedback,
        },
      };
      try {
        const result = await classCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error sending feedback:", error);
        res.status(500).send("Error sending feedback");
      }
    });

    // Update class status to approved
    app.patch("/classes/approve/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      try {
        const result = await classCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error approving class:", error);
        res.status(500).send("Error approving class");
      }
    });

    // Update class status to denied
    app.patch("/classes/deny/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "denied",
        },
      };
      try {
        const result = await classCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error denying class:", error);
        res.status(500).send("Error denying class");
      }
    });

    //create-payment-intent(Stripe)

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.put("/payments/:id", async (req, res) => {
      const payment = req.body;
      const id = req.params.id;
      const updateDoc = {
        $set: payment,
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      // console.log(payment);
      const result = await cartCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.put("/classUpdates/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const updateDoc = {
        $set: data,
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      // console.log(payment);
      const result = await classCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Music land is running");
});

app.listen(port, () => {
  console.log(`music land is running on port ${port}`);
});
