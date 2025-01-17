const express = require('express');
const app = express();

app.use((req,res,next)=>{
    console.log("middleware is executed");
    next();
});

app.get('/',(req,res)=>{
    res.send('Hello world');
});

const PORT = 4040;
app.listen(PORT,()=>{
    console.log('server is running on port 4040');
})

