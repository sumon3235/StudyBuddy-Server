require('dotenv').config()
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();


// MidleWare
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5jgflna.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("StudyBuddy");
    const assignmentsCollection = database.collection("assignments")

    // Post Route For Assignments
    app.post('/add-assignments', async(req, res) => {
        const assignments = req.body;
        const result = await assignmentsCollection.insertOne(assignments);
        res.send(result);
    })

    // Get All The Job Data From Database
    app.get('/all-assignments', async(req, res) => {
      const cursor = assignmentsCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    })

    // Get A specific jobData from database
    app.get('/assignments/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await assignmentsCollection.findOne(filter);
      res.send(result);
    })

    // Update a Specific  jobdata 
    app.put('/assignments/:id', async(req, res) => {
      const assignment = req.body;
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
         const updatedDoc = {
        $set: {...assignment}
      }
      const result = await assignmentsCollection.updateOne(query,updatedDoc);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req,res) => {
  res.send('Assignments is Ready ')
})

app.listen(port, () => {
  console.log(`app is running port: ${port}`)
})

