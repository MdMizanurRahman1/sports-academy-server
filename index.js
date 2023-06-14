const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;


// middlewares
app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })
}


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
        // await client.connect();


        const usersCollection = client.db("sportDb").collection("users");
        const classCollection = client.db("sportDb").collection("popularClass");
        const instructorCollection = client.db("sportDb").collection("instructor");
        const cardCollection = client.db("sportDb").collection("card");
        const addCollection = client.db("sportDb").collection("addClass");
        const paymentCollection = client.db("sportDb").collection("payments");



        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        // Warning: use verifyJWT before using verifyAdmin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }

        //TODO verifyJWT before using verifyInstructor
        const verifyInstructor = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'instructor') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }



        // users related api

        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        })


        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = { email: user.email }
            const remainingUser = await usersCollection.findOne(query)
            if (remainingUser) {
                return res.send({ message: 'user already existed' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })


        //admin route

        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })


        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        // instructor route

        app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ instructor: false })
            }

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === 'instructor' }
            res.send(result);
        })


        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'instructor'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })





        //popular class in home page experiment...can be changed later

        // app.get('/class', async (req, res) => {
        //     const result = await classCollection.find().toArray();
        //     res.send(result)
        // })

        app.get('/class', async (req, res) => {
            const result = await classCollection.find()
                .sort({ students: -1 }) // Sort in descending order based on the "students" field
                .limit(6) // Limit the results to 6 documents
                .toArray();
            res.send(result);
        });




        //TODO secure for instructor
        app.post('/add', verifyJWT, verifyInstructor, async (req, res) => {
            const newItem = req.body;
            const result = await addCollection.insertOne(newItem)
            res.send(result);
        })

        app.get('/add', async (req, res) => {
            const result = await addCollection.find().toArray();
            res.send(result)
        })

        app.get('/manage', verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([]);
            }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' });
            }
            const query = { email: email };
            const result = await addCollection.find(query).toArray();
            res.send(result);

        })



        app.get('/instructor', async (req, res) => {
            const result = await instructorCollection.find().toArray();
            res.send(result)
        })




        //APi cart related 

        app.get('/card', verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([]);
            }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' });
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


        // Create a Payment Intent
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        app.post('/payments', verifyJWT, async (req, res) => {
            const payment = req.body;
            const insertResult = await paymentCollection.insertOne(payment);

            const itemId = payment.id;
            const deleteResult = await cardCollection.deleteOne({ _id: itemId });

            res.send({ insertResult, deleteResult });
        });


        // app.get('/payments', async (req, res) => {
        //     const result = await paymentCollection.find().toArray();
        //     res.send(result)
        // })

        app.get('/payments', async (req, res) => {
            const result = await paymentCollection.find().sort({ date: -1 }).toArray();
            res.send(result);
        });



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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