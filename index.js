require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const app = express();

// MidleWare
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5jgflna.mongodb.net/?appName=Cluster0`;

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
    await client.connect();
    const database = client.db("StudyBuddy");
    const assignmentsCollection = database.collection("assignments");
    const submittedCollection = database.collection("submitted");

    // jwt Authentication
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        })
        .send({ success: true });
    });

    // Clear A token
    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        })
        .send({ success: true });
    });

    // MiddleWare Funtion
    const verifyToken = (req, res, next) => {
      const token = req.cookies?.token;
      if (!token) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized" });
        }
        req.user = decoded;
        next();
      });
    };

    // Post Route For Assignments
    app.post("/add-assignments", verifyToken, async (req, res) => {
      const assignments = req.body;
      const result = await assignmentsCollection.insertOne(assignments);
      res.send(result);
    });

    // Get All The assignments From Database
    app.get("/all-assignments", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await assignmentsCollection
        .find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // Get A specific assignmet from database
    app.get("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.findOne(filter);
      res.send(result);
    });

    // Update a Specific  assignmnet
    app.put("/assignments/:id", verifyToken, async (req, res) => {
      const assignment = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: { ...assignment },
      };
      const result = await assignmentsCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // Get Estimate Count for Assignment
    app.get("/count", async (req, res) => {
      const count = await assignmentsCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // Delet a Specific assignment
    app.delete("/assignments/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.deleteOne(query);
      res.send(result);
    });

    // All Submission Collection Starat

    // Post A submission collection
    app.post("/submissions", verifyToken, async (req, res) => {
      const submission = req.body;
      const result = await submittedCollection.insertOne(submission);
      res.send(result);
    });

    // Get A Pending Data Form submission Collection
    app.get("/submissions", async (req, res) => {
      const query = { status: "pending" };
      const result = await submittedCollection.find(query).toArray();
      res.send(result);
    });

    // Get a specific submitted data
    app.get("/submissions/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submittedCollection.findOne(query);
      res.send(result);
    });

    //  Update A specific submitted Data
    app.patch("/submissions/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const { obtainedMarks, feedback, status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: { obtainedMarks, feedback, status: "completed" },
      };
      const result = await submittedCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Get a MyAssigment Data
    app.get("/my-assignments", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { examinee_email: email };
      const result = await submittedCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Assignments is Ready ");
});

app.listen(port, () => {
  console.log(`app is running port: ${port}`);
});
