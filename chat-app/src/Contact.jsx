import Avatar from "./Avatar";

export default function Contact({personId,onClick,username, selected, online}){
    return(
        <div key={personId} onClick={()=>onClick(personId)} 
            className={"border-b border-gray-200 flex items-center gap-2 cursor-pointer"+(selected?'bg-blue-500':'')}>
            {selected && (
                <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
            )}
            <div className="pl-4 py-2 flex gap-2 items-center cursor-pointer">
                <Avatar online={online} username={username} userId={personId}/>
                <span className="text-gray-800">{username}</span> 
            </div>
        </div>
    );
}