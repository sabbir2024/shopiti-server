const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParcer = require('cookie-parser')
require('dotenv').config()



const port = process.env.PORT || 3000;

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    "methods": "GET, PUT, PATCH, POST, DELETE",
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(bodyParser.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yxlyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const productsColection = client.db('shopitiDB').collection('products')
        const userColection = client.db('shopitiDB').collection('user')
        const orderColection = client.db('shopitiDB').collection('addCard')


        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const secret = process.env.ACCESS_SECRET_TOKEN
            const token = jwt.sign(user, secret, {
                expiresIn: '1h'
            })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'

                })
                .send({ success: true })
        })

        app.get('/logout', (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                    maxAge: 0
                })
                .send({ success: true })
        })


        // user releted api

        app.get('/user', async (req, res) => {
            const result = await userColection.find().toArray();
            res.send(result)
        })

        app.post('/user', async (req, res) => {
            const body = req.body;
            const email = body?.email
            const filter = { email: email }

            try {
                const existingUser = await userColection.findOne(filter)
                if (existingUser) {
                    res.status(409).send({ message: "Email already exists" })
                }
                const result = await userColection.insertOne(body);
                res.send(result)
            } catch (error) {
                console.log("🚀 ~ app.post ~ error:", error)
                res.status(500).send({ message: "Internal Server Error" });

            }

        })

        app.patch('/user/:id', async (req, res) => {
            const id = req.params.id;
            const body = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: { role: body.role }
            };
            const result = await userColection.updateOne(filter, updateDoc, options);
            res.send(result)
        })


        // product releted api
        app.get('/products', async (req, res) => {
            try {
                const result = await productsColection.find().toArray();
                res.send(result);
            } catch (error) {
                console.log("🚀 ~ app.get ~ error:", error)
                res.status(500).send('Error fetching products');


            }
        })

        app.get('/products/:id', async (req, res) => {

            const id = req.params.id
            const quary = { _id: new ObjectId(id) }
            try {
                const result = await productsColection.findOne(quary);
                res.send(result);
            } catch (error) {
                console.log("🚀 ~ app.get ~ error:", error)
                res.status(500).send('Error fetching products');


            }
        })

        app.post('/add-product', async (req, res) => {
            const body = req.body;

            try {
                const result = await productsColection.insertOne(body);
                res.send(result)
            } catch (error) {
                console.log("🚀 ~ app.post ~ error:", error)
                res.status(500).send({ message: "Internal Server Error" });

            }
        })

        app.delete('/removed-product/:id', async (req, res) => {
            const id = req.params.id
            const quary = { _id: new ObjectId(id) };
            try {
                const result = await productsColection.deleteOne(quary)
                res.send(result)
            } catch (error) {
                console.log("🚀 ~ app.post ~ error:", error)
                res.status(500).send({ message: "Internal Server Error" });

            }
        })

        // order releted api

        app.get('/added-to-card/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { _id: 0, img: 1, title: 1, discription: 1, price: 1, email: 1, color: 1, size: 1, ProductId: 1 },
            };
            try {
                const result = await orderColection.find(filter, options).toArray();
                res.send(result)
            } catch (error) {
                res.status(500).send({ message: "Internal Server Error" });
            }
        })

        app.post('/add-to-card', async (req, res) => {
            const body = req.body;
            try {
                const result = await orderColection.insertOne(body)
                res.send(result)
            } catch (error) {
                res.status(500).send({ message: "Internal Server Error" });
            }

        })





        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Welcome to shopiti World!')
})

app.listen(port, () => {
    console.log(`shopiti app listening on port ${port}`)
})