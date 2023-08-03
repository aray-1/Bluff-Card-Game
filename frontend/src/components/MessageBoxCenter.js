import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../providers/AppContext";

function MessageBoxCenter(){

    const messageTimeout = 2000; // milliseconds
    const {centerMessage, setCenterMessage, showCenterMessage, setShowCenterMessage} = useContext(AppContext);
    const timeout = useRef();

    useEffect(()=>{
        if(!showCenterMessage) return;

        timeout.current = setTimeout(()=>{
            setShowCenterMessage(false);
            setCenterMessage("");
        },messageTimeout);

        return ()=>{
            clearTimeout(timeout.current);
        }

    },[showCenterMessage])


    return (
        <div className="message-box-center-wrapper">
            {showCenterMessage && <div className="popup-wrapper">
                <div className="popup-overlay"></div>
                <div className="popup-container message-box-center-container">
                    <div className="message-center">
                        {centerMessage}
                    </div>
                </div>
            </div>}
        </div>
    );
}

export default MessageBoxCenter;