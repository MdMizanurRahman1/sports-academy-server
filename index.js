const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middlewares
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2kfdekm.mongodb.net/?retryWrites=true&w=majority`;

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

        const classCollection = client.db("sportDb").collection("popularClass");
        const instructorCollection = client.db("sportDb").collection("instructor");
        const cardCollection = client.db("sportDb").collection("card");

        app.get('/class', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result)
        })
        app.get('/instructor', async (req, res) => {
            const result = await instructorCollection.find().toArray();
            res.send(result)
        })




        //APi cart related 

        app.get('/card', async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([]);
            }
            const query = { email: email };
            const result = await cardCollection.find(query).toArray();
            res.send(result);

        })

        app.post('/card', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cardCollection.insertOne(item);
            res.send(result);
        })


        app.delete('/card/:id', async (req, res) => {
            const id = parseInt(req.params.id);
            // const query = { _id: new ObjectId(id) }
            const result = await cardCollection.deleteOne({ _id: id });
            res.send(result)
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








app.get('/', (req, res) => {
    res.send('Academy is going to be fulled soon')
})

app.listen(port, () => {
    console.log(`Sports academy is admiting students on port ${port}`)
})