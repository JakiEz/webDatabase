const express = require("express");
const pool = require("./config/db.js");
const port = "1337"
const cors = require('cors');
const app = express()
app.use(cors());
// dotenv.config();
app.use(express.json())


app.get('/get',async(req,res)=>{
  try{
     const data = await pool.query('SELECT * FROM users')
      res.status(200).send(data.rows)
  } catch (err){
      console.log(err)
      res.sendStatus(500)
  }
})


app.post('/insert', async (req, res) => {
  try {

    const {name, address} = req.body;

    if (!name){
      return res.status(400).send({
          success:false,
          message:"name is required"
      });
    }


    await pool.query(`INSERT INTO userss (name, address) VALUES ($1,$2)`,[name,address || null] );
    
    res.status(200).send({
      success: true,
      message: "user inserted successfully"
    });

  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).send({
      success: false,
      message: "Failed to saved data",
      error: err.message
    });
  }
});

// app.post('/products/:id', async (req,res)=>{
//   try{
//       await pool.query('CREATE TABLE products (id VARCHAR(255) PRIMARY KEY,name VARCHAR(255) NOT NULL,category VARCHAR(100) NOT NULL,price DECIMAL(10, 2) NOT NULL)')
//       res.status(200).send({message:"SUCCESFULLY CREATE TABLE"})
//   } catch (err){
//       console.log(err)
//       res.sendStatus(500)
//   }
// })


// app.post('/shoeTable', async (req,res)=>{
//   try{
//       await pool.query('CREATE TABLE products (id VARCHAR(255) PRIMARY KEY,name VARCHAR(255) NOT NULL,category VARCHAR(100) NOT NULL,price DECIMAL(10, 2) NOT NULL)')
//       res.status(200).send({message:"SUCCESFULLY CREATE TABLE"})
//   } catch (err){
//       console.log(err)
//       res.sendStatus(500)
//   }
// })

// app.post('/setup', async (req,res)=>{
//   try{
//       await pool.query('CREATE TABLE userss(id SERIAL PRIMARY KEY, name VARCHAR(100), address VARCHAR(100))')
//       res.status(200).send({message:"SUCCESFULLY CREATE TABLE"})
//   } catch (err){
//       console.log(err)
//       res.sendStatus(500)
//   }
// })

app.post('/createShoeTable', async (req,res)=>{
  try{
      await pool.pool.query('CREATE TABLE IF NOT EXISTS sneakers (id SERIAL PRIMARY KEY,name VARCHAR(100),price NUMERIC(10),subtitle VARCHAR(255),main_image TEXT,tagline VARCHAR(100),environmental_info TEXT,description TEXT,color_name VARCHAR(100),style_code VARCHAR(50),made_in VARCHAR(100),is_new BOOLEAN,thumbnails JSONB,sizes JSONB)')
      res.status(200).send({message:"SUCCESFULLY CREATE TABLE"})
  } catch (err){
      console.log(err)
      res.sendStatus(500)
  }
})

app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.status(200).json({ message: 'API is working' });
});


app.get('/health', async (req, res) => {
  try {
    const result = await pool.pool.query('SELECT NOW()');
    res.status(200).send({
      status: 'ok',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).send({ status: 'error', message: err.message });
  }
});

app.post('/sneakers', async (req, res) => {
  const {id, name, price, main_image, subtitle } = req.body;
  try {
    const result = await pool.pool.query(
      'INSERT INTO sneakers (id, name, price, main_image, subtitle) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, price, main_image, subtitle]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/createUsers', async (req, res) => {
  const {clerk_id, email, role} = req.body;
  try {

    const checkResut = await pool.pool.query('SELECT * from users where clerk_id = $1', [clerk_id]);

    if (checkResut.rows.length > 0 ){
      return res.send("user with this clerk ID already exist")
    }

    const result = await pool.pool.query(
      'INSERT INTO users (clerk_id, email, role) VALUES ($1, $2, $3) RETURNING *',
      [clerk_id, email, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/getUserRole', async (req, res) => {
  const { clerk_id } = req.query;
  try {
    const result = await pool.pool.query(
      'SELECT role FROM users WHERE clerk_id = $1',
      [clerk_id]
    );
    
    if (result.rows.length > 0) {
      res.json({ role: result.rows[0].role });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/createUserTable', async (req, res) => {
  try {
    await pool.pool.query(
      'CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, clerk_id VARCHAR(255) UNIQUE, email VARCHAR(255) UNIQUE NOT NULL, role VARCHAR(50) DEFAULT \'user\')'
    );
    res.status(200).send({message: "SUCCESSFULLY CREATED USERS TABLE"});
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get('/getUsers', async (req, res) => {
  try {
    console.log('Starting query to users table');
    const result = await pool.pool.query('SELECT * FROM users');
    console.log(`Query successful, found ${result.rows.length} rows`);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Update user role endpoint
app.put('/updateUserRole', async (req, res) => {
  const { clerk_id, role } = req.body;
  
  if (!clerk_id || !role) {
    return res.status(400).json({ error: "clerk_id and role are required" });
  }
  
  try {
    const result = await pool.pool.query(
      'UPDATE users SET role = $1 WHERE clerk_id = $2 RETURNING *',
      [role, clerk_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/getSneakers', async (req, res) => {
  try {
    console.log('Starting query to sneakers table');
    const result = await pool.pool.query('SELECT * from sneakers');
    console.log(`Query successful, found ${result.rows.length} rows`);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET product by ID (matches /products/:id pattern)
app.get('/getSneaker/:id', async (req, res) => {
  try {
    const productId = req.params.id; // Extracts "1" from /products/1
    const result = await pool.pool.query(
      'SELECT * FROM sneakers WHERE id = $1',
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]); // Return single product
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

  
app.listen(port, ()=> console.log(`Server has started on port ${port}`))