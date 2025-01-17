export default function Avatar({userId, username, online}){
    // calculate color from their userid 
    const colors = ['bg-teal-200', 'bg-red-200',  'bg-green-200', 'bg-purple-200' ,
                     'bg-blue-200', 'bg-yellow-200'];
    // now split them between id's
    // convert the hex num of userid into integer
    // console.log(userId)
    const userIdBase10 = parseInt(userId, 16);
    // console.log(userIdBase10%colors.length);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];
    // console.log(color)
    return(
        <div className={"w-8 h-8 bg-red-300 relative rounded-full flex items-center justify-center"+color}>
            {/* same color is maintained even if we refresh the page alos because their ids will be same  */}
            <div className="text-center w-full opacity-70">
                {username[0]}
            </div>
            {online && (
                <div className="absolute w-3 h-3 bg-blue-400 rounded-full bottom-0 right-0"></div>
            )}
            {!online &&(
                <div className="absolute w-3 h-3 bg-gray-400 rounded-full bottom-0 right-0"></div>
            )}

        </div>
    )
}