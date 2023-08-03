import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../providers/AppContext";

function MessageBox(){

    const messageTimeout = 2000; // milliseconds
    const transitionTime = 300 // milliseconds
    const { message, showMessage, setShowMessage } = useContext(AppContext);
    const [containerClass, setContainerClass] = useState("message-box-container-hide display-none");


    useEffect(()=>{
        if(message.length === 0) return;
        if(!showMessage) return;

        setContainerClass("message-box-container-hide");
        setTimeout(()=>{
            messageBoxAnimate();
        },50)
    },[showMessage]);

    function messageBoxAnimate(){
        setContainerClass("message-box-container-display");
        setTimeout(()=>{
            setContainerClass("message-box-container-hide");
            setTimeout(()=>{
                setContainerClass("message-box-container-hide display-none");
                setShowMessage(false);
            }, transitionTime)
        }, messageTimeout);
    }

    return (
        <div className={containerClass}>
            {message}
        </div>
    );
}

export default MessageBox;