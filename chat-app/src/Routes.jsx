import { useContext } from "react";
import { UserContext } from "./UserContext.jsx";
import Chat from "./Chat.jsx";
import RegisterAndLoginForm from "./RegisterAndLoginForm";

export default function Routes(){
    const {username, id} = useContext(UserContext);

    if(username){
        return  <Chat/>;
    }
    return(
        <RegisterAndLoginForm/>
    );
}