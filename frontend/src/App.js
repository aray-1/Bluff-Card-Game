import React, { useContext, useEffect } from "react";
import { AppContext } from "./providers/AppContext";
import Landing from "./pages/Landing Page/Landing";
import CreateRoom from "./pages/Create Room/CreateRoom";
import Game from "./pages/Game Page/Game";
import RotateDevice from "./components/RotateDevice";
import MessageBox from "./components/MessageBox";
import MessageBoxCenter from "./components/MessageBoxCenter";
import "./App.css";

function App(){

    const { socket, path, isLoggedIn, setIsLoggedIn, accessToken, setAccessToken, playerName, setPlayerName, windowDimension, setWindowDimension, isLandscape, setIsLandscape, setMyFriendDetails, setReceivedInvitesDetails, setSentInvitesDetails, setInviteLoading, setReceivedInviteLoading } = useContext(AppContext);

    let fontSizeFactor = Math.min((windowDimension.width / 1536), (windowDimension.height / 754));
    fontSizeFactor = Math.ceil(fontSizeFactor * 100) / 100;

    useEffect(()=>{
        function changeSize(){
            setWindowDimension({width : window.innerWidth, height: window.innerHeight});
        }
        window.addEventListener("resize", changeSize);

        return ()=>{
            window.removeEventListener("resize", changeSize);
        }
    },[windowDimension]);

    useEffect(()=>{
        const mediaQuery = window.matchMedia("(orientation : landscape)");

        function handleOrientationChange(event){
            setIsLandscape(event.matches);
        }

        setIsLandscape(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleOrientationChange);

        return ()=>{
            mediaQuery.removeEventListener("change", handleOrientationChange);
        }
    },[isLandscape]);

    useEffect(()=>{
        socket.on("updated-friends-list", (data)=>{
            setMyFriendDetails(data.friends);
        });

        socket.on("player-logged-in", (data)=>{
            setMyFriendDetails(prevFriends=>{
                return prevFriends.map((friend)=>{
                    if(friend.playerName !== data.playerName) return friend;
                    return {
                        ...friend,
                        online : true
                    };
                });
            });
        });

        socket.on("player-logged-out", (data)=>{
            setMyFriendDetails(prevFriends=>{
                return prevFriends.map((friend)=>{
                    if(friend.playerName !== data.playerName) return friend;
                    return {
                        ...friend,
                        online : false
                    };
                });
            });
        });

        socket.on("change-friend-name", (data)=>{
            const prevName = data.prevName;
            const newName = data.newName;
            setMyFriendDetails(prevFriends=>{
                return prevFriends.map((friend)=>{
                    if(friend.playerName !== prevName) return friend;
                    return {
                        ...friend,
                        playerName : newName
                    };
                });
            });
        });

        socket.on("add-friend-invited", (data)=>{
            if(playerName === data.sender){
                setSentInvitesDetails(prevInvites=>[...prevInvites, {playerName : data.receiver}]);
            }
            else if(playerName === data.receiver){
                setReceivedInvitesDetails(prevInvites=>[...prevInvites, {playerName : data.sender}]);
            }
            setInviteLoading(false);
        });

        socket.on("friend-added", (data)=>{
            setMyFriendDetails(prevFriends=>[...prevFriends, data.friend]);
            setReceivedInvitesDetails(prevInvites=>{
                return prevInvites.filter((invite)=>{
                    if(invite.playerName !== data.friend.playerName) return true;
                    return false;
                });
            });
            setSentInvitesDetails(prevInvites=>{
                return prevInvites.filter((invite)=>{
                    if(invite.playerName !== data.friend.playerName) return true;
                    return false;
                });
            });
            setReceivedInviteLoading(false);
        });

        socket.on("invite-declined", (data)=>{
            const sender = data.sender;
            const receiver = data.receiver;
            if(sender === playerName){
                setSentInvitesDetails(prevInvites=>{
                    return prevInvites.filter((invite)=>{
                        if(invite.playerName !== receiver) return true;
                        return false;
                    });
                });
            }
            else if(receiver === playerName){
                setReceivedInvitesDetails(prevInvites=>{
                    return prevInvites.filter((invite)=>{
                        if(invite.playerName !== sender) return true;
                        return false;
                    });
                });
            }
        });

        socket.on("invite-cancelled", (data)=>{
            if(data.sender === playerName){
                setSentInvitesDetails(prevInvites=>{
                    return prevInvites.filter((invite)=>{
                        if(invite.playerName !== data.receiver) return true;
                        return false;
                    });
                });
            }
            else if(data.receiver === playerName){
                setReceivedInvitesDetails(prevInvites=>{
                    return prevInvites.filter((invite)=>{
                        if(invite.playerName !== data.sender) return true;
                        return false;
                    });
                });
            }
        });

        return ()=>{
            socket.removeAllListeners("updated-friends-list");
            socket.removeAllListeners("player-logged-in");
            socket.removeAllListeners("player-logged-out");
            socket.removeAllListeners("change-friend-name");
            socket.removeAllListeners("add-friend-invited");
            socket.removeAllListeners("friend-added");
            socket.removeAllListeners("invite-declined");
            socket.removeAllListeners("invite-cancelled");
        }

    },[socket, playerName]);

    return (
        <div className="app-container">
            <style>
                {
                    `:root{
                        --color-0 : #FFFFFF;
                        --background-color: rgb(33, 192, 255);
                        --button-color : #9900FF;
                        --button-hover-color : #7600D0;
                        --box-background : #E572FF;
                        --size-factor : ${fontSizeFactor};
                    }`
                }
            </style>
            <MessageBox />
            <MessageBoxCenter />
            {!isLandscape && <RotateDevice />}
            {path.pathname === "/" && <Landing />}
            {path.pathname === "/create-room" && <CreateRoom />}
            {path.pathname === "/game-room" && <Game />}
        </div>
    );
}

export default App;