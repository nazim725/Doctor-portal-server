// I love sejin
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// middleWare
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9s2cu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    // console.log("connected database")
    const database = client.db("doctors_portal");
    const appointmentCollection = database.collection("appointments");
    const userCollection = database.collection("users");
    const doctorCollection = database.collection("doctors");

    // save appointment to database
    app.post("/appointments", async (req, res) => {
      const appointment = req.body;
      // console.log(req.body)
      const result = await appointmentCollection.insertOne(appointment);
      res.json(result);
    });

    // save user to the database when who register by email and password
    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(appointment)
      const result = await userCollection.insertOne(user);
      res.json(result);
    });

    // google dia login korle database e save korar jonno
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // make admin

    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
    // get all appointments according to email
    app.get("/appointments", async (req, res) => {
      const email = req.query.email;
      const date = new Date(req.query.date).toLocaleDateString();
      // const date = req.query.date;
      const query = { email: email, date: date };
      console.log(query);
      const cursor = appointmentCollection.find(query);
      const appointments = await cursor.toArray();
      res.json(appointments);
    });

    // get get apppoint according to id
    app.get("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await appointmentCollection.findOne(query);
      res.json(result);
    });

    // add doctor
    app.post("/doctors", async (req, res) => {
      console.log("body", req.body);
      console.log("files", req.files);
      res.json({ success: true });
    });
    // payment method

    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });

    app.put("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment,
        },
      };
      const result = await appointmentCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
  } finally {
    // await client.close(()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.json("Doctors Portal Server");
});

app.listen(port, () => {
  console.log(`Listening Doctors Portal at :${port}`);
});
