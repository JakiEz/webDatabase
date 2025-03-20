const express = require("express");
const pool = require("./config/db.js");
const port = "1337"

// dotenv.config();

const app = express()
app.use(express.json())
// app.use(cors)

app.get('/get',async(req,res)=>{
    try{
       const data = await pool.query('SELECT * FROM users')
        res.status(200).send(data.rows)
    } catch (err){
        console.log(err)
        res.sendStatus(500)
    }
})

// const data = {name: "jackie",
//     location
// }

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






app.post('/setup', async (req,res)=>{
    try{
        await pool.query('CREATE TABLE userss(id SERIAL PRIMARY KEY, name VARCHAR(100), address VARCHAR(100))')
        res.status(200).send({message:"SUCCESFULLY CREATE TABLE"})
    } catch (err){
        console.log(err)
        res.sendStatus(500)
    }
})
  
app.listen(port, ()=> console.log(`Server has started on port ${port}`))