import React, { createContext, useState } from "react";
import io from "socket.io-client";

const domain = "http://localhost:4000";
// const domain = "https://5369-110-224-187-203.ngrok-free.app";
const socket = io(domain, {
    withCredentials : true,
    extraHeaders : {
        "ngrok-skip-browser-warning" : true
    }
});

export const AppContext = createContext();

export const AppProvider = ({children})=>{
    // global state variables
    
    const ngrokHeader = {"ngrok-skip-browser-warning": true};
    const logo = "./Images/logo.png";

    const cards = {
        "AC": "./Images/cards/AC.png",
        "2C": "./Images/cards/2C.png",
        "3C": "./Images/cards/3C.png",
        "4C": "./Images/cards/4C.png",
        "5C": "./Images/cards/5C.png",
        "6C": "./Images/cards/6C.png",
        "7C": "./Images/cards/7C.png",
        "8C": "./Images/cards/8C.png",
        "9C": "./Images/cards/9C.png",
        "10C": "./Images/cards/10C.png",
        "KC": "./Images/cards/KC.png",
        "QC": "./Images/cards/QC.png",
        "JC": "./Images/cards/JC.png",
        "AS": "./Images/cards/AS.png",
        "2S": "./Images/cards/2S.png",
        "3S": "./Images/cards/3S.png",
        "4S": "./Images/cards/4S.png",
        "5S": "./Images/cards/5S.png",
        "6S": "./Images/cards/6S.png",
        "7S": "./Images/cards/7S.png",
        "8S": "./Images/cards/8S.png",
        "9S": "./Images/cards/9S.png",
        "10S": "./Images/cards/10S.png",
        "KS": "./Images/cards/KS.png",
        "QS": "./Images/cards/QS.png",
        "JS": "./Images/cards/JS.png",
        "AH": "./Images/cards/AH.png",
        "2H": "./Images/cards/2H.png",
        "3H": "./Images/cards/3H.png",
        "4H": "./Images/cards/4H.png",
        "5H": "./Images/cards/5H.png",
        "6H": "./Images/cards/6H.png",
        "7H": "./Images/cards/7H.png",
        "8H": "./Images/cards/8H.png",
        "9H": "./Images/cards/9H.png",
        "10H": "./Images/cards/10H.png",
        "KH": "./Images/cards/KH.png",
        "QH": "./Images/cards/QH.png",
        "JH": "./Images/cards/JH.png",
        "AD": "./Images/cards/AD.png",
        "2D": "./Images/cards/2D.png",
        "3D": "./Images/cards/3D.png",
        "4D": "./Images/cards/4D.png",
        "5D": "./Images/cards/5D.png",
        "6D": "./Images/cards/6D.png",
        "7D": "./Images/cards/7D.png",
        "8D": "./Images/cards/8D.png",
        "9D": "./Images/cards/9D.png",
        "10D": "./Images/cards/10D.png",
        "KD": "./Images/cards/KD.png",
        "QD": "./Images/cards/QD.png",
        "JD": "./Images/cards/JD.png",
        "test" : "./Images/card-AceSpades.png",
        "back" : "./Images/card-back-Blue.png"
    };
    const cardNames=["A","2","3","4","5","6","7","8","9","10","K","Q","J"];
    const cardCodeToName={
        "A" : "Ace",
        "2" : "Two",
        "3" : "Three",
        "4" : "Four",
        "5" : "Five",
        "6" : "Six",
        "7" : "Seven",
        "8" : "Eight",
        "9" : "Nine",
        "10" : "Ten",
        "K" : "King",
        "Q" : "Queen",
        "J" : "Jack"
    }

    const [path, setPath] = useState({pathname : "/", state : {}});
    const [accessToken, setAccessToken] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [playerName, setPlayerName] = useState("");
    const [playerID, setPlayerID] = useState("NOT IMPLEMENTED");
    const [message, setMessage] = useState("");
    const [showMessage, setShowMessage] = useState(false);
    const [centerMessage, setCenterMessage] = useState("");
    const [showCenterMessage, setShowCenterMessage] = useState(false);
    const [myFriendDetails, setMyFriendDetails] = useState([]);
    const [receivedInvitesDetails, setReceivedInvitesDetails] = useState([]);
    const [sentInvitesDetails, setSentInvitesDetails] = useState([]);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [receivedInviteLoading, setReceivedInviteLoading] = useState(false);
    const [windowDimension, setWindowDimension] = useState({width : window.innerWidth, height: window.innerHeight});
    const [isLandscape, setIsLandscape] = useState(false);

    const value = {
        domain,
        socket,
        ngrokHeader,
        logo,
        cards,
        cardNames,
        cardCodeToName,
        path,
        setPath,
        accessToken,
        setAccessToken,
        isLoggedIn,
        setIsLoggedIn,
        playerName,
        setPlayerName,
        playerID,
        setPlayerID,
        message,
        setMessage,
        showMessage,
        setShowMessage,
        centerMessage,
        setCenterMessage,
        showCenterMessage,
        setShowCenterMessage,
        myFriendDetails,
        setMyFriendDetails,
        receivedInvitesDetails,
        setReceivedInvitesDetails,
        sentInvitesDetails,
        setSentInvitesDetails,
        inviteLoading,
        setInviteLoading,
        receivedInviteLoading,
        setReceivedInviteLoading,
        windowDimension,
        setWindowDimension,
        isLandscape,
        setIsLandscape
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}