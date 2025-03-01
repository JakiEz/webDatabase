const express = require("express");
const pool = require("./db");
const port = "1337"

const app = express()
app.use(express.json())


app.get('/',(req,res)=>{
    res.sendStatus(200)
})

app.post('/user',(req,res)=>{
    const {name, id} = req.body;
})

app.listen(port, ()=> console.log(`Server has started on port ${port}`))