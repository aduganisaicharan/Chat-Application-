const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const User = require('./models/User');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const ws = require('ws');


// cors --> we get cors error we define it in our api express what kind of apps can talk with our api 
// cors is a library to send a cors headers in response 
dotenv.config();
mongoose.connect(process.env.MONGO_URL);
const jwtsecret = process.env.JWT_SECRET;           
const bcryptSalt = bcrypt.genSaltSync(10);


const app = express();
app.use(express.json()); 
app.use(cookieParser());


app.use(cors({
    // configuration 
    origin:  'http://localhost:5173', // host name is the origin 
    methods:['GET', 'POST', 'PUT', 'DELETE'],   
    credentials:true,
    }));
    
async function getUserDataFromRequest(req){
    return new Promise((resolve,reject)=>{
        // return new Promise((resolve, reject)=>{})
        const token = req.cookies?.token;
        if(token){
            jwt.verify(token, jwtsecret,{},(err,userdata)=>{ // this is callback so to use callback and to return values we need to put return promise 
                if(err)throw err;
                resolve(userdata);
            });
        }
        else{ // if we dont have any token 
            reject('no token');
        }
        // we find it in message model in database using this user id 
        Message.find()
    });
     // this will return 

}
app.get('/test', (req, res) => {
    console.log('Test route called');
    res.status(200).json({ message: 'Test route is working' });
});



app.get('/messages/:userId',async (req,res)=>{
    // res.json(req.params);//to see that we get this user id 
    const {userId} = req.params;
    // we use this userid to fetch mesages between us and this userid 
    const userdata = await getUserDataFromRequest(req);// here inside userdata we have userid and username ==> here we have promise inside aso we need to wait for this promise so put await 
    const ourUserid = userdata.userId;
    // console.log({userId,ourUserid});
    // we find it in message model in database using this user id 
    const messages = await Message.find({
        sender:{$in:[userId, ourUserid]}, // says within this array  // either the userid selected or our userid      // within $ in: ==> no space in middle
        recipient:{$in:[userId, ourUserid]},
        // either we are the sender and recipient is other user or other user is sender and we are the recipient 
    }).sort({createdAt:1}).exec();
    res.json(messages);

})

app.get('/profile', (req, res)=>{
    const token = req.cookies?.token;
    if(token){
        jwt.verify(token, jwtsecret, {}, (err,userdata)=>{
            if(err) throw err;
            res.json(userdata);
        });
    }
    else{
        res.status(401).json('no token');
    }
});

app.get('/people',async(req,res)=>{
    const users = await User.find({},{'_id':1, 'username':1});
    res.json(users);
})

app.post('/login', async (req,res)=>{
    const {username, password} = req.body;
    const foundUser = await User.findOne({username});  
    if(foundUser){
        const passOk = bcrypt.compareSync(password, foundUser.password);
        if(passOk){
            jwt.sign({userId:foundUser._id, username}, jwtsecret, {}, (err, token)=>{
                res.cookie('token', token,  ).json({
                    id:foundUser._id,
                })
            });
        }
    }
});

app.post('/register', async (req, res)=>{
    console.log('Request received at /register');
    const {username, password} = req.body;
    console.log('Username:', username);
    console.log('Password:', password);
    try{
        const hashedpassword = bcrypt.hashSync(password, bcryptSalt);
        console.log('Password hashed');
        const createduser = await User.create({
            username:username,
            password:hashedpassword,
        });
        console.log('User created:', createduser);
        jwt.sign({userId:createduser._id, username}, jwtsecret, {} ,(err, token)=>{
            if(err) throw err;
            console.log('JWT created:', token);
            res.cookie('token', token).status(201).json({
                _id:createduser._id,
                username
            });
        });
    }
    catch(error){
        console.error('Error in /register:', error);
        if(error) throw error;
        res.status(500).json('error');
    }
});

const server = app.listen(4040,()=>{
    console.log("Server running");
});
// can create a web socket server using this server object
const wss = new ws.WebSocketServer({server});
// ws is a library
// wss is a server 
wss.on('connection', (connection, req) =>{  // here we also need req info that we can use further to access the person id and name 

// In WebSockets, "ping-pong" refers to a mechanism used to check if the connection between the client and the server is still active. It works like this:
// Ping: One side (usually the server) sends a small message called a "ping" to the other side (the client).
// Pong: The other side (the client) responds with a "pong" message to acknowledge that it's still connected and functioning.
// This process helps ensure that:
// The connection is not broken or inactive.
// The client or server can detect and clean up dead connections.
// WebSocket connections are long-lasting, but sometimes they can silently drop (e.g., due to network issues or timeouts). Without ping-pong, neither the client nor the server would know that the other has gone offline. The ping-pong mechanism solves this by providing regular checks.

    function notifyAboutOnlinePeople(){
        // now for each client we want to send inffo who is online 
        // notify everyone about online people (when someone connects)
        [...wss.clients].forEach(client=>{      
            client.send(JSON.stringify({
                // here we are sending as an object instead of an array  --> taken by the handlemessage at chat.jsx
                // the object named online has all below client info 
                online:[...wss.clients].map(c=>( 
                    {
                        userId:c.userId,
                        username:c.username
                    }
                ))
            })); // pass a string as a message or pass like json stringify 
            // inside json stringify we can put object or array of people who are online 
            // sending info of all clients to every client 
        });          
    }
    connection.isAlive = true;
    connection.timer = setInterval(()=>{
        connection.ping(); // sent from server 
        // every second we check it is alive or not if not we set alive to false 
        connection.deathtimer = setTimeout(()=>{
            connection.isAlive = false;
            connection.terminate();
            notifyAboutOnlinePeople();
            console.log('dead');
        },1000)
    }, 5000)

    connection.on('pong',()=>{ // done by client
        // console.log('pong');
        clearTimeout(connection.deathtimer);
    })
    // no. of connections is similar to no. of pongs 
    console.log(req.headers); // this will print lot of info like host, connection, cookie --> 
    // read username and id from the cookie for this conneciton 
    const cookies = req.headers.cookie;
    if(cookies){
        const tokencookiestring = cookies.split(';').find(str => str.startsWith('token'));
        if(tokencookiestring){
            const token = tokencookiestring.split('=')[1];
            if(token){
                jwt.verify(token, jwtsecret, {}, (err, userdata)=>{
                    if(err) throw err;
                    // console.log(userdata);
                    const {userId, username} = userdata; // userdata has username, userid
                    // put this userdata to our connection and the connection is between our server and specific client connection
                    //  this is our web socket connection to a  client
                    connection.userId = userId;
                    connection.username=username;
                    // now we are saving this info to our connection and all connections sit inside the wss web socket server 
                    // we sill grap all the clients from the web socket server and see if they is online 
                });
            }
        }
    }

    // next thing is to grab all the clients from the web socket connection and see if they are online 

    // we are getting the incomming messages 2 times even when the user sends it for only once but here the event is occuring twice so all the data inside is similar except the timestamp i hope 
    // to overcome this we need to try
    // lets create identifiers to all messages 
    // because when we run react app in devlopment mode it will render every component  2 times 

    // we take that connection and want to define what should happen when conneciton sends a message 
    connection.on('message', async(message) =>{ // when this connection sends a message then we are doing this 
        //  console.log(message); this message is a binary buffer 
        // type of message is a object 
        const messageData = JSON.parse(message.toString()); // to convert to object of userid and message 
        const {recipient, text} = messageData; // inside messageData we have recipient id, text 
        // before sending lets put them into database because we need this to retrieve them later
        //when we receive the message at connection line 115 we are just sending it to the connections of this recipient Id i.e userID
        
        if(recipient && text){ // when both of these present then only we can send it to other person 
            // here where we are sending  our message to other person 
            // Lets save our message in database 
            // this returns a promise so use await and async 
            const messageDoc = await Message.create({
                sender:connection.userId,
                recipient,
                text,
            }); // this will return a promise so we need to either add await or other 
            // this will after promise it will return this messgae document so will store it in messagedocument
             // if we do [...wss.clients].find() is not correct way because some times this selected user may connected to many devices hence to send all of them hence do filter instead of find 
            // recipient has the userid that we need to send the msg to 
            [...wss.clients]// most likely it will get disconnected when we add something inside our api/index.js --> every time we change something it will restart server 
            .filter(c=>c.userId === recipient) // we get no. of devices that userid is logged in 
            .forEach(c=>c.send(JSON.stringify({ // for each device connceted we want to send 
                text,
                sender:connection.userId ,
                recipient,
                _id:messageDoc._id, // this is message id
            }))) ; // here we are sending the text but not who is the sender 
            // we dont have the information about the person who is sending this
        }

    });               

    // we are saving this info into a connection and all connections sit inside web socket server wss . client 
                // after connection establishment we try to find the userid and username 
                // now grab all the clients from the wss and see if they are online 
                // wss.clients --> this is an object of clients --> transform to array ==> [...wss.clients]
                // console.log([...wss.clients].map(c=>c.username))

    // notify 
    notifyAboutOnlinePeople();
       
});

// wss.on('close',data=>{
//         console.log('disconnect');
// })

// property called clients that will show all the active connecitons over here 

//MrXOBGutRyXhAu1y

// lodash --> all built in techniques of functions

// wss.clients --> this will have all the active connections 



// axios network error
// Possible Causes:
// Backend Server Not Running:

// The backend server at localhost:4040 is not started or crashed.
// Incorrect Port or URL:

// The frontend might be configured to use the wrong port or endpoint for the API.
// CORS Issues:

// If the backend is running but not configured to handle requests from the frontend's origin.
// Network Issues:

// Something is blocking the connection, like a firewall or VPN.

// fully functional chat app
// can send msgs / can receive msgs / and can receive them from database when we select a person / had full history of msgs