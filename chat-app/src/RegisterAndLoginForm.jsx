import { useState, useContext } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";
function RegisterAndLoginForm(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setLoginOrRegister] = useState('register');
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);
    async function handlesubmit(ev){
        ev.preventDefault();
        const url = isLoginOrRegister === 'register' ? 'register' : 'login';
        console.log(username);
        const {data} = await axios.post(url, {username, password},{
            headers:{
                'Content-Type':'application/json',
            },
        });
        console.log(data);
        setLoggedInUsername(data.username);
        setId(data.id);
       
    }
    return(
        <>
        <div className="bg-blue-300 h-screen flex flex-col justify-center items-center">
            <h1 className="font-semibold text-2xl font-serif mb-2">Chat-Application</h1>
            <form className="w-80 mx-auto border border-black shadow-lg p-4 bg-white rounded-md" onSubmit={handlesubmit}>
                <div className="m-2">
                    <h2 className="text-center font-semibold text-xl mb-2">Welcome to Application</h2>
                    <input value={username}
                    onChange={ev => setUsername(ev.target.value)}
                    type="text" placeholder="Username"  
                    className="block rounded-sm p-2 mb-2 border w-full" />
                    <input value={password} 
                    onChange={ev => setPassword(ev.target.value)} 
                    type="password" placeholder="password" 
                    className="block rounded-sm p-2 mb-2 border w-full"/>
                    <button className="bg-blue-500 text-white block p-2 w-full rounded-sm">
                        {isLoginOrRegister === 'register'?'register':'Login'}
                    </button>
                    <div className="text-center mt-2"> 
                        {isLoginOrRegister==='register'&&(
                            <div>
                                Already a member? 
                                <button onClick={()=>{
                                    setLoginOrRegister('login')
                                }}>Login here</button>
                            </div>
                        )}
                        {isLoginOrRegister === 'login' &&(
                            <div>
                                Dont have an account?
                                <button onClick={()=>setLoginOrRegister('register')}>
                                    Register
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
            <div>
                {
                    // console.log(username)
                }
            </div>
        </div>
        </>
    );
}
export default RegisterAndLoginForm