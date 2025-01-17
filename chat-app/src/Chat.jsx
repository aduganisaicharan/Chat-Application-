import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar.jsx";
import Logo from "./Logo.jsx";
import { UserContext } from "./UserContext.jsx";
import axios from "axios";
import { uniqBy } from "lodash";
import Contact from "./Contact.jsx";
export default function Chat(){
    // make connection with websocket 
    const [ws, setWs] = useState(null); // here ws means wsconnection
    const [onlinePeople,setOnlinePeople] = useState({}); // in html we cant map becauase that is object hence here also object declaration 
    const [offlinePeople,setOfflinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState('');
    const [messages, setMessages] = useState([]); // this is array of objects and every objects has text inside it 
    const divUndermessages = useRef();
    const {username, id} = useContext(UserContext);
    // when this chat component mount we need to do some ransome code 
    // we want to connect to our web socket 
    useEffect(()=>{
        connectToWs();
        // when someting is changed in indexjs file teh connectin is lost with other user because server is upated 
        // now we need to know when the server is disconnected and reconnect it 
        // add things that should happen when we receive a message 
        
    },[]);  

    function connectToWs(){
        // even if we reload now every this works sbetter if we change something in indexjs fiel
        const ws = new WebSocket('ws://localhost:4040'); // we need to connect the url
        setWs(ws);
        // console.log(ws);
        ws.addEventListener('message', handlemessage);
        ws.addEventListener('close',()=>{
            setTimeout(()=>{
                console.log("Disconnected! trying to reconnect");
                connectToWs();
            },1000);
        })
    }

    function showOnlinePeople(peopleArray){ //connections // here it can be duplecates bcaz online:user1,user2, user1, user2 , ... with their userid and username
        // their can be many connections from one person 
        const people = {};//store in key value format  key - id, value -username
        // we need to display the people in left side with uniquely 
        peopleArray.forEach(({userId,username})=>{ // directly grabing userid and username from person i.e forEach((person)=>{person.userId})
            people[userId]=username; // adding into the object with key value pair 
        })
        // console.log(people); // now we only have the unique people without any duplicates --> use it for displaying 
        // put them in state before printing them on site as online people
        // these people are called as online people
        setOnlinePeople(people);
    }

    function handlemessage(ev){
        // console.log('new message',e);
        // we need to parse the json which includes the client info 
        const messageData = JSON.parse(ev.data); // converts the string form of client info to object form and store in messageData
        console.log({ev, messageData}); // lets always display the event and messageData
        if('online' in messageData){ // key name of the object which has info of userId and username of clients connected 
            showOnlinePeople(messageData.online);
        }
        else if('text' in messageData){
            // console.log({messageData})
            setMessages(prev => ([...prev, {...messageData}])); // we dont know who is actually the sender because our server is not saying this 
            // destruct to get all the fields from message data 
        }
    }

    function sendMessage(ev){
        ev.preventDefault(); // it will not reload the page 
        // while we sending message we need to grab our web socket server and we send msg towards web socket server 
        ws.send(JSON.stringify({ // we not only want to send text but also the user information
            recipient:selectedUserId,
            text:newMessageText,
        })); // send a message and info of user id that we selected towards web socket server
        setMessages(prev =>([...prev,{
            text:newMessageText,
            sender:id,
            recipient:selectedUserId,
            _id:Date.now()
        }]));
        setNewMessageText('');
    }
    
    useEffect(()=>{
        const div = divUndermessages.current;
        // console.log(div);
        if(div){
            div.scrollIntoView({behaviour:'smooth', block:'end'});
        }// we didnot rendered till now hence no changes may happen hence if div inside is rendered then we can make use of it
    },[messages]);

    // useeffect for online people so that we can figure out the offline people too by accessing the data from the data base 
    useEffect(()=>{
        // grab all the people from database and filter out the online peple to get offline people  
        axios.get('/people').then(res=>{
            const offlinePeopleArr = res.data // collect all the users data from database
            .filter(p=>p._id !== id) // select only the people whose id is not same as my id i.e exclude myself
            .filter(p => !Object.keys(onlinePeople).includes(p._id)); // select only the people who are not in onlinepeople
            const offlinePeopleobj = {}
            offlinePeopleArr.forEach(p=>{
                offlinePeopleobj[p._id]  = p;
            })
            setOfflinePeople(offlinePeopleobj);
        })
    },[onlinePeople]) // run everytime onlinepeople changes and this happen everytime we open the app 

    useEffect(()=>{
        if(selectedUserId){
            // we will receive our messages between our user and this selected user 
            axios.get('/messages/'+selectedUserId).then(res=>{// this returns a promise 
                const {data} = res;
                setMessages(data);
            });   
        }
    },[selectedUserId]);
    // selecting a connection or another user chat
        // selecting a contact means saving to a state 
    // const onlinePeopleExcludingLoginUser = onlinePeople.filter(p => p.username !== username); // filter is not a funciton because onlinepeople is not an array instead it is an object
    const onlinePeopleExcludingLoginUser = {...onlinePeople}; // copy of onlinepeople 
    delete onlinePeopleExcludingLoginUser[id];

    const messageswithoutDupes = uniqBy(messages,'_id');
    return(
        <div className="h-screen flex">
            <div className="bg-blue-50 w-1/3"> 
            <Logo/>
            {Object.keys(onlinePeopleExcludingLoginUser).map( personId =>( // id's will be they keys 
                    <Contact 
                    key={personId}
                    personId ={personId}
                    online={true}
                    username={onlinePeopleExcludingLoginUser[personId]}
                    onClick={()=>setSelectedUserId(personId)}
                    selected = {personId === selectedUserId}
                    />
            ))} 
            {console.log(onlinePeopleExcludingLoginUser)}
            
            {Object.keys(offlinePeople).map( personId =>( // id's will be they keys 
                    <Contact 
                    key={personId}
                    personId={personId} 
                    online={false}
                    username={offlinePeople[personId].username}
                    onClick={()=>setSelectedUserId(personId)}
                    selected = {personId === selectedUserId}
                    />

            ))} 
                 {/* if i refresh then no person is selected then you need to put a message to select a person  */}
            </div>
            <div className="bg-blue-200 flex flex-col w-2/3 p-2">
            <div className="flex-grow">
                {/* // check if any selected person if we dont have any then display message */}
                {!selectedUserId && (
                        <div className="flex h-full items-center justify-center">
                           <div className="text-gray-400"> &larr; Select a person from sidebar </div>  
                        </div>
                )}
                {/* // now we still cant send messgages to selected person lets do it  */}
                {!!selectedUserId && (
                    
                        <div className="relative h-full ">
                            <div className="overflow-y-scroll absolute top-0 bottom-2 right-0 left-0 p-2">
                                {messageswithoutDupes.map(message=>(
                                    <div key={message._id} className={(message.sender === id)?'text-right':'text-left'}>
                                        <div className={"text-left inline-block my-2 rounded-md text-sm"+(message.sender === id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600')}>
                                            {/* sender:{message.sender}<br />
                                            myid:{id}<br /> */}
                                            {message.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={divUndermessages}></div>
                            </div>
                            {/* <div ref={divUndermessages} >  this is added to include scroll to bottom feature */}
                            {/* </div> */}
                        </div>
                )}
            </div>
            
            {/* should not able to see if we not selected the user  */}
            {!!selectedUserId && ( // if we have selected the user then this integer gets converted to boolean (empty - false otherwise true)
                <form className="flex gap-2" onSubmit={sendMessage}>
                    <input type="text" 
                    value={newMessageText}
                    onChange={event => setNewMessageText(event.target.value)}
                    placeholder="Type your message here" 
                    className="bg-white flex-grow border rounded-sm p-2" />
                    <button type="submit" className="bg-blue-500 p-2 text-white">Send</button>
                </form>
            )}
            </div>
        </div>
    );
}