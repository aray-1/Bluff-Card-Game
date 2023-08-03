import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppContext } from "../../providers/AppContext";
import axios from "axios";
import "./Landing.css";

const invalidCharacters = new Set(['<','>','.','/',',','?',':',';','\'','\"','{','[','}',']','|','\\','`','~','!','@','#','$','%','^','&','*','(',')','-','_','=','+']);

function FriendsList(props){
    const { path, domain, socket, ngrokHeader, accessToken, isLoggedIn, setMessage, setShowMessage, myFriendDetails, setMyFriendDetails, receivedInvitesDetails, setReceivedInvitesDetails, sentInvitesDetails, setSentInvitesDetails, receivedInviteLoading, setReceivedInviteLoading } = useContext(AppContext);
    const { setSearchPlayerPopup } = props;

    const receivedInviteRef = useRef();
    const sentInviteRef = useRef();

    const [friendAndInviteTab, setFriendAndInviteTab] = useState(0);
    const [receivedSentTab, setReceivedSentTab] = useState(0);
    const [inviteActiveWidth, setInviteActiveWidth] = useState(0);
    // receivedInviteLoading kept in Context 
    const [sentInviteLoading, setSentInviteLoading] = useState(false);

    const myFriends = useMemo(()=>{
        return myFriendDetails.map((friend)=>{
            return (
                <div className="friend" key={Math.ceil(Math.random()*100000)}>
                    <div className="friend-name">{friend.playerName}</div>
                    <div className={`friend-${friend.online ? "online" : "offline"}`}></div>
                </div>
            );
        })
    },[myFriendDetails]);

    const receivedInvites = useMemo(()=>{
        return receivedInvitesDetails.map((invite)=>{
            return (
                <div className="received-invite-container" key={Math.ceil(Math.random()*100000)}>
                    <div className="received-invite-name">
                        <span>{invite.playerName}</span>
                    </div>
                    <div className="received-invite-buttons">
                        <div className="received-invite-accept-btn" onClick={()=>{acceptInvite(invite.playerName)}}>Accept</div>
                        <div className="received-invite-decline-btn" onClick={()=>{declineInvite(invite.playerName)}}>Decline</div>
                    </div>
                </div>
            );
        })
    },[receivedInvitesDetails, receivedInviteLoading]);

    const sentInvites = useMemo(()=>{
        return sentInvitesDetails.map((invite)=>{
            return (
                <div className="sent-invite-container" key={Math.ceil(Math.random()*100000)}>
                    <div className="sent-invite-name">
                        <span>{invite.playerName}</span>
                    </div>
                    <div className="sent-cancel-invite-btn" onClick={()=>{cancelInvite(invite.playerName)}}>Cancel</div>
                </div>
            );
        });
    },[sentInvitesDetails, sentInviteLoading]);

    useEffect(()=>{
        if(path.pathname === "/" && isLoggedIn){
            const authHeader = {
                "Authorization" : `Bearer ${accessToken}`
            }
    
            axios.get(`${domain}/user/friends`, {headers : {...authHeader, ...ngrokHeader}})
            .then((response)=>{
                socket.emit("update-friends-list", {friends : response.data.friends});
            })
            .catch((err)=>{
                console.log(err.message);
            })

            axios.get(`${domain}/user/received-invites`, {headers : {...authHeader, ...ngrokHeader}})
            .then((response)=>{
                setReceivedInvitesDetails(response.data.receivedInvites);
            })
            .catch((err)=>{
                console.log(err.message);
                console.log(err.response?.data.errorMessage);
            })

            axios.get(`${domain}/user/sent-invites`, {headers : {...authHeader, ...ngrokHeader}})
            .then((response)=>{
                setSentInvitesDetails(response.data.sentInvites);
            })
            .catch((err)=>{
                console.log(err.message);
                console.log(err.response?.data.errorMessage);
            })
        }
        if(!isLoggedIn){
            setMyFriendDetails([]);
        }

        setFriendAndInviteTab(0);
        setReceivedSentTab(0);
        
    },[path?.pahtname, isLoggedIn]);

    useEffect(()=>{
        if(friendAndInviteTab===0) return;
        if(receivedSentTab === 0){
            const container = receivedInviteRef.current;
            const rect = container.getBoundingClientRect();
            const width = Math.round(rect.right - rect.left);
            setInviteActiveWidth(width);
        }
        else if(receivedSentTab === 1){
            const container = sentInviteRef.current;
            const rect = container.getBoundingClientRect();
            const width = Math.round(rect.right - rect.left);
            setInviteActiveWidth(width);
        }
    },[receivedSentTab, friendAndInviteTab]);

    function toggleFriendInviteTab(tabNumber){
        setFriendAndInviteTab(tabNumber);
    }

    function toggleReceivedSentTab(tabNumber){
        setReceivedSentTab(tabNumber);
    }

    function openSearchPlayer(){
        if(!isLoggedIn){
            setMessage("Please Login To Add Friends");
            setShowMessage(true);
            return;
        }
        setSearchPlayerPopup(true);
    }

    function acceptInvite(invitedPlayerName){
        if(receivedInviteLoading) return;
        setReceivedInviteLoading(true);
        
        const requestBody = {invitedPlayerName};
        const authHeader = {
            "Authorization" : `Bearer ${accessToken}`
        }
        
        axios.post(`${domain}/user/accept-invite`, requestBody, {headers : {...authHeader, ...ngrokHeader}})
        .then((response)=>{
            socket.emit("add-friend", {invitedPlayerName})
        })
        .catch((err)=>{
            console.log(err.message);
            console.log(err.response?.data.message);
        })
    }

    function declineInvite(invitedPlayerName){
        if(receivedInviteLoading) return;
        setReceivedInviteLoading(true);

        const requestBody = {invitedPlayerName};
        const authHeader = {
            "Authorization" : `Bearer ${accessToken}`
        }

        axios.post(`${domain}/user/decline-invite`, requestBody, {headers : {...authHeader, ...ngrokHeader}})
        .then((response)=>{
            socket.emit("decline-friend-invite", {invitedPlayerName});
        })
        .catch((err)=>{
            console.log(err.message);
            console.log(err.response.data.errorMessage);
        })
    }

    function cancelInvite(invitedPlayerName){
        if(sentInviteLoading) return;
        setSentInviteLoading(true);

        const requestBody = {invitedPlayerName};
        const authHeader = {
            "Authorization" : `Bearer ${accessToken}`
        }

        axios.post(`${domain}/user/cancel-invite`, requestBody, {headers : {...authHeader, ...ngrokHeader}})
        .then((response)=>{
            socket.emit("cancel-friend-invite", {receiver : invitedPlayerName});
        })
        .catch((err)=>{
            console.log(err.message);
            console.log(err.response?.data.errorMessage);
        })
    }

    return (
        <div className="friends-list-container">
            <style>
                {
                    `.invites-active-tab{
                        --invites-active-width: ${inviteActiveWidth}px;
                        ${receivedSentTab === 0 ? "left: 0px;":
                        `left: 100%;
                        transform: translateX(-100%)`}
                    }`
                }
            </style>
            <div className="friend-list-tabs">
                <div className={`tab${friendAndInviteTab === 0 ? " active-tab" : ""}`} onClick={()=>{toggleFriendInviteTab(0)}}>Friends</div>
                <div className={`tab${friendAndInviteTab === 1 ? " active-tab" : ""}`} onClick={()=>{toggleFriendInviteTab(1)}}>Invites</div>
            </div>
            {friendAndInviteTab === 0 && <div className="friends-container">
                <div className="search-friends-btn" onClick={openSearchPlayer}>
                    Add Friend
                    <div className="search-friend-icon">
                        <i className="fa-solid fa-user-plus"></i>
                    </div>
                </div>
                <div className="friends">
                    {isLoggedIn ? myFriends : <div className="friends-no-login">Please Login To View Your Friends</div>}
                </div>
            </div>}
            {friendAndInviteTab === 1 && <div className="invites-container">
                <div className="invite-tabs">
                    <div className="receive-invite-tab" onClick={()=>{toggleReceivedSentTab(0)}} ref={receivedInviteRef}>
                        Received
                    </div>
                    <div className="sent-invite-tab" onClick={()=>{toggleReceivedSentTab(1)}} ref={sentInviteRef}>
                        Sent
                    </div>
                    <div className="invites-active-tab"></div>
                </div>
                <div className="invites">
                    {!isLoggedIn ? <div className="invites-no-login">Please Login To View Invites</div> : receivedSentTab === 0 ? receivedInvites : sentInvites}
                </div>
            </div>}
            {/* Needed to shift search player popup due css positioning problems */}
        </div>
    );
}

function Landing(){
    const { setPath, logo, playerName, setPlayerName, setIsLoggedIn, isLoggedIn, setMessage, setShowMessage, domain, setAccessToken, accessToken, ngrokHeader, socket, inviteLoading, setInviteLoading } = useContext(AppContext);
    // useRef variables
    const playerNameRef = useRef();
    const loginRef = useRef();
    const joinCreateRef = useRef();
    const searchPlayerRef = useRef();
    const notificationPopupRef = useRef();

    //popup variables
    const [loginPopup, setLoginPopup] = useState(false);
    const [signupPopup, setSignupPopup] = useState(false);
    const [joinCreatePopup, setJoinCreatePopup] = useState(false);
    const [enterRoomCode, setEnterRoomCode] = useState(false);
    const [searchPlayerPopup, setSearchPlayerPopup] = useState(false);
    const [notificationsPopup, setNotificationsPopup] = useState(false);

    const [editName, setEditName] = useState(false);
    const [changedName, setChangedName] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [invalidUserText, setInvalidUserText] = useState("");
    const [signinDetails, setSigninDetails] = useState({userName : "", password : ""});
    const [signupDetails, setSignupDetails] = useState({userName : "", password : "", confirmPassword : ""});
    const [roomCode, setRoomCode] = useState("");

    //class changing variables
    const [signinInvalidClass, setSigninInvalidClass] = useState("signin-invalid-hide");
    const [signinLoadingClass, setSigninLoadingClass] = useState("signin-no-loading");
    const [signinOverlayClass, setSigninOverlayClass] = useState("signin-no-overlay");
    const [usernameLabelClass, setUsernameLabelClass] = useState("signin-username-label-down");
    const [passwordLabelClass, setPasswordLabelClass] = useState("signin-password-label-down");
    const [signupLoadingClass, setSignupLoadingClass] = useState("signup-no-loading");
    const [signupOverlayClass, setSignupOverlayClass] = useState("signup-no-overlay");
    const [invalidUserClass, setInvalidUserClass] = useState("invalid-user-hide");
    const [usernameLabelClassSignup, setUsernameLabelClassSignup] = useState("signup-username-label-down");
    const [passwordLabelClassSignup, setPasswordLabelClassSignup] = useState("signup-password-label-down");
    const [confirmPasswordLabelClassSignup, setConfirmPasswordLabelClassSignup] = useState("signup-confirm-password-label-down");

    // search friends variables
    const [searchPlayerLoading, setSearchPlayerLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [searchPlayerResult, setSearchPlayerResult] = useState([]);

    // notifications variables
    const [notificationDetails, setNotificationDetails] = useState([]);
    const [uniqueNotifications, setUniqueNotifications] = useState(new Set());

    const searchedPlayers = searchPlayerResult.map((player)=>{
        return (
            <div className="searched-player-container" key={Math.ceil(Math.random()*10000)}>
                <div className="searched-player-name">{player.playerName}</div>
                <div className="searched-player-invite-btn" onClick={()=>{invitePlayer(player.playerName)}}>Invite</div>
            </div>
        );
    });

    const notifications = notificationDetails.map((notification, index)=>{
        const gameInvite = <div className="notification-container" key={Math.ceil(Math.random()*10000)}>
            <div className="notification-header">Game Invite</div>
            <div className="notification-message">{notification.sender} has invited you to a game</div>
            <div className="notification-room-code">Room Code : <span onClick={()=>{copyRoomCode(notification.roomCode)}}>{notification.roomCode}</span></div>
            <div className="notification-buttons">
                <div className="notification-accept" onClick={()=>{acceptGameInvite(notification.roomCode)}}>Accept</div>
                <div className="notification-decline" onClick={()=>{declineInvite(index)}}>Decline</div>
            </div>
        </div>

        switch (notification.type){
            case "game-invite":
                return gameInvite;
            default:
                return <div></div>;
        }
    })

    useEffect(()=>{
        socket.on("join-success", (data)=>{
            console.log(data.message);
            setRoomCode("");
            setPath(prevState => {
                return {
                    ...prevState,
                    pathname : "/game-room",
                    state : {
                        roomCode : data.roomCode,
                        gameSettings : data.gameSettings,
                        myCards : data.myCards,
                        players : data.players,
                        gameOn : data.gameOn
                    }
                };
            });
        });

        socket.on("rejoin-success", (data)=>{
            setRoomCode("");
            setPath(prevState => {
                return {
                    ...prevState,
                    pathname : "/game-room",
                    state : {
                        roomCode : data.roomCode,
                        gameSettings : data.gameSettings,
                        myCards : data.myCards,
                        players : data.players,
                        gameOn : data.gameOn
                    }
                }
            })
        });

        socket.on("join-failure", (data)=>{
            setMessage(data.message);
            setShowMessage(true);
            setRoomCode("");
        });

        socket.on("game-invite", (data)=>{
            // Notification Code description : <type><other-inforamtion>
            // GI -> Game Invite
            const notificationCode = `GI${data.sender}${data.roomCode}`;
            if(uniqueNotifications.has(notificationCode)) return;
            
            const newNotification = {
                type : "game-invite",
                sender : data.sender,
                roomCode : data.roomCode
            }
            setNotificationDetails(prevDetails => [newNotification, ...prevDetails]);
            setUniqueNotifications(prevSet => new Set(prevSet.add(notificationCode)));
        });

        return ()=>{
            socket.removeAllListeners("join-success");
            socket.removeAllListeners("rejoin-success");
            socket.removeAllListeners("join-failure");
            socket.removeAllListeners("game-invite");
        }
        
    },[socket, uniqueNotifications]);

    useEffect(()=>{
        setChangedName(playerName);
    },[playerName]);

    useEffect(()=>{
        function handleClick(event){
            if(editName && playerNameRef.current && !playerNameRef.current.contains(event.target)){
                setEditName(false);
                if(changedName !== playerName) changeUsername();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return ()=>{
            document.removeEventListener("mousedown", handleClick);
        }
    });

    useEffect(()=>{
        function handleClick(event){
            if(loginPopup && !loginRef.current.contains(event.target)){
                setLoginPopup(false);
                setSignupPopup(false);
                setUsernameLabelClass("signin-username-label-down");
                setPasswordLabelClass("signin-password-label-down");
                setSigninDetails({userName : "", password : ""});

                setUsernameLabelClassSignup("signup-username-label-down");
                setPasswordLabelClassSignup("signup-password-label-down");
                setConfirmPasswordLabelClassSignup("signup-confirm-password-label-down");
                setSignupDetails({userName : "", password : "", confirmPassword : ""});
            }
        }
        document.addEventListener("mousedown", handleClick);
        return ()=>{
            document.removeEventListener("mousedown", handleClick);
        }
    });

    useEffect(()=>{
        function handleClick(event){
            if(!joinCreateRef.current.contains(event.target)){
                setJoinCreatePopup(false);
                setEnterRoomCode(false);
                setRoomCode("");
            }
        }
        document.addEventListener("mousedown", handleClick);
        return ()=>{
            document.removeEventListener("mousedown", handleClick);
        }
    });

    useEffect(()=>{
        function handleClick(event){
            if(searchPlayerRef.current && !searchPlayerRef.current.contains(event.target)){
                closeSearchPlayer();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return ()=>{
            document.removeEventListener("mousedown", handleClick);
        }
    });

    useEffect(()=>{
        function handleClick(event){
            if(notificationPopupRef.current && !notificationPopupRef.current.contains(event.target)){
                setNotificationsPopup(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return ()=>{
            document.removeEventListener("mousedown", handleClick);
        }
    });

    function handlePlay(){
        if(!isLoggedIn){
            setMessage("Please Login To Play");
            setShowMessage(true);
            return;
        }
        setJoinCreatePopup(true);
    }

    function toggleEditName(){
        if(!isLoggedIn){
            setMessage("Please Login To Change Name");
            setShowMessage(true);
            return;
        }
        if(editName){
            setChangedName(playerName);
        }
        setEditName(prevState=>!prevState);
    }

    function toggleLoginPopup(){
        if(isLoggedIn){
            setAccessToken("");
            setPlayerName("");
            setChangedName("");
            setNotificationDetails([]);
            setIsLoggedIn(false);
            setMessage("Logged Out");
            setShowMessage(true);
            socket.emit("handle-logout");
            return;
        }
        setLoginPopup(true);
    }

    function handleNameChange(event){
        if(changedName.length < event.target.value.length){
            const newChar = event.target.value[event.target.value.length - 1];
            if(invalidCharacters.has(newChar)) return;
        }
        setChangedName(event.target.value);
    }

    function handleUsernameFocus(){
        setUsernameLabelClass("signin-username-label-up");
    }

    function handleUsernameBlur(){
        if(!signinDetails.userName) setUsernameLabelClass("signin-username-label-down");
    }

    function handlePasswordFocus(){
        setPasswordLabelClass("signin-password-label-up");
    }

    function handlePasswordBlur(){
        if(!signinDetails.password) setPasswordLabelClass("signin-password-label-down");
    }

    function handleUsernameSignupFocus(){
        setUsernameLabelClassSignup("signup-username-label-up");
    }

    function handleUsernameSignupBlur(){
        if(!signupDetails.userName) setUsernameLabelClassSignup("signup-username-label-down");
    }

    function handlePasswordSignupFocus(){
        setPasswordLabelClassSignup("signup-password-label-up");
    }

    function handlePasswordSignupBlur(){
        if(!signupDetails.password) setPasswordLabelClassSignup("signup-password-label-down");
    }

    function handleConfirmPasswordFocus(){
        setConfirmPasswordLabelClassSignup("signup-confirm-password-label-up");
    }

    function handleConfirmPasswordBlur(){
        if(!signupDetails.confirmPassword) setConfirmPasswordLabelClassSignup("signup-confirm-password-label-down");
    }

    function handlePaste(event){
        event.preventDefault();
    }

    function toggleShowPassword(){
        setShowPassword(prevState=>!prevState);
    }
    
    function handleSigninChange(event){
        setSigninInvalidClass("signin-invalid-hide");
        setSigninDetails(prevDetails=>{
            return {
                ...prevDetails,
                [event.target.name] : event.target.value
            }
        });
    }

    function handleSignupChange(event){
        if(invalidUserClass === "invalid-user-display"){
            setInvalidUserClass("invalid-user-hide");
            setInvalidUserText("");
        }
        if(event.target.name === "userName"){
            if(event.target.value.length === 20) return;

            if(signupDetails.userName.length < event.target.value.length){
                const newChar = event.target.value[event.target.value.length - 1];
                if(invalidCharacters.has(newChar)) return;
            }
        }
        setSignupDetails(prevDetails=>{
            return {
                ...prevDetails,
                [event.target.name] : event.target.value
            }
        });
    }

    function handleCodeChange(event){
        if(event.target.value.length <= 6) setRoomCode(event.target.value.toUpperCase());
    }

    function handleJoinKeyDown(event){
        if(event.key === "Enter") checkRoomCode();
    }

    function handleSigninKeyDown(event){
        if(event.key === "Enter") handleSignin();
    }

    function goToSignin(){
        setSignupPopup(false);
    }

    function goToSignup(){
        setSigninInvalidClass("signin-invalid-hide")
        setSignupPopup(true);
    }

    function handleSignin(){
        if(signinDetails.userName.length === 0 || signinDetails.password.length === 0){
            setSigninInvalidClass("signin-invalid-display");
            return;
        }

        const requestBody = {
            "userName" : signinDetails.userName,
            "password" : signinDetails.password
        }

        setSigninInvalidClass("signin-invalid-hide");
        setSigninLoadingClass("signin-loading");
        setSigninOverlayClass("signin-overlay");
        axios.post(`${domain}/user/sign-in`, requestBody, {headers : {...ngrokHeader}})
        .then((response)=>{
            setSigninLoadingClass("signin-no-loading");
            setSigninOverlayClass("signin-no-overlay");
            setUsernameLabelClass("signin-username-label-down");
            setPasswordLabelClass("signin-password-label-down");
            setAccessToken(response.data.accessToken);
            setPlayerName(signinDetails.userName);
            setChangedName(signinDetails.userName);
            setSigninDetails({userName : "", password : ""});
            setLoginPopup(false);
            setIsLoggedIn(true);
            setMessage("Logged In Successfully!!");
            setShowMessage(true);
            socket.emit("handle-login", {playerName : signinDetails.userName});
        })
        .catch((err)=>{
            console.log(err.message);
            console.log(err.response.data.errorMessage);
            setSigninLoadingClass("signin-no-loading");
            setSigninOverlayClass("signin-no-overlay");
            setSigninInvalidClass("signin-invalid-display");
            setUsernameLabelClass("signin-username-label-down");
            setPasswordLabelClass("signin-password-label-down");
            setSigninDetails({userName : "", password : ""});
        })
    }

    function handleSignup(){
        if(signupDetails.userName.length === 0){
            setInvalidUserClass("invalid-user-display");
            setInvalidUserText("Username Is Required");
            return;
        }
        else if(signupDetails.password.length === 0){
            setInvalidUserClass("invalid-user-display");
            setInvalidUserText("Password Is Required");
            return;
        }
        else if(signupDetails.confirmPassword.length === 0){
            setInvalidUserClass("invalid-user-display");
            setInvalidUserText("Confirm Password Is Required");
            return;
        }
        else if(signupDetails.password !== signupDetails.confirmPassword){
            setInvalidUserClass("invalid-user-display");
            setInvalidUserText("Password And Confirm Password Do Not Match")
            return;
        }

        const requestBody = {
            "userName" : signupDetails.userName,
            "password" : signupDetails.password
        }

        setSignupLoadingClass("signup-loading");
        setSignupOverlayClass("signup-overlay");
        axios.post(`${domain}/user/sign-up`, requestBody, {headers : {...ngrokHeader}})
        .then((response)=>{
            setMessage(response.data.message);
            setShowMessage(true);
            setSignupLoadingClass("signup-no-loading");
            setSignupOverlayClass("signup-no-overlay");
            setSignupPopup(false);
        })
        .catch((err)=>{
            console.log(err.message);
            console.log(err.response.data.errorMessage);
            setSignupLoadingClass("signup-no-loading");
            setSignupOverlayClass("signup-no-overlay");
            setInvalidUserClass("invalid-user-display");
            setInvalidUserText(err.response.data.errorMessage);
        })
    }

    function changeUsername(){
        setMessage("changing");
        setShowMessage(true);

        const requestBody = {
            "userName" : changedName
        }
        const authHeader = {
            "Authorization" : `Bearer ${accessToken}`
        }
        axios.post(`${domain}/user/change-name`, requestBody, {headers : {...authHeader, ...ngrokHeader}})
        .then((response)=>{
            setPlayerName(changedName);
            setAccessToken(response.data.accessToken);
            socket.emit("change-username", {prevName : playerName, newName : changedName});
        })
        .catch((err)=>{
            console.log(err.message);
            console.log(err.response?.data.errorMessage);
            setChangedName(playerName);
            setMessage("There was some problem changing your name");
            setShowMessage(true);
        });
    }

    function checkRoomCode(){
        if(roomCode.length<6){
            setMessage("Room Does Not Exist");
            setShowMessage(true);
            setRoomCode("");
            return;
        }
        socket.emit("join-room", {playerName, roomCode});
    }

    function goToCreateRoom(){
        setPath(prevState=>{
            return {
                ...prevState,
                pathname : "/create-room"
            }
        });
    }

    function closeJoinCreatePopup(){
        if(enterRoomCode) setEnterRoomCode(false);
        else setJoinCreatePopup(false);
    }

    // search player functions
    function handleSearchChange(event){
        if(searchText.length < event.target.value.length){
            const newChar = event.target.value[event.target.value.length - 1];
            if(invalidCharacters.has(newChar)) return;
        }
        setSearchText(event.target.value);
    }

    function handleSearchKeyDown(event){
        if(event.key === "Enter") searchPlayers();
    }

    function searchPlayers(){
        if(searchPlayerLoading || searchText.length === 0) return;
        setSearchPlayerLoading(true);
        setSearchPlayerResult([]);

        const authHeader = {
            "Authorization" : `Bearer ${accessToken}`
        }
        const requestBody = {searchText};

        axios.post(`${domain}/user/search-player`, requestBody, {headers : {...authHeader, ...ngrokHeader}})
        .then((response)=>{
            // console.log(response.data.users);
            setSearchPlayerResult(response.data.users);
            setSearchPlayerLoading(false);
        })
        .catch((err)=>{
            setSearchPlayerLoading(false);
            console.log(err.message);
            console.log(err.response?.data.errorMessage);
        })
    }

    function invitePlayer(invitedPlayerName){ 
        if(!isLoggedIn || inviteLoading) return;
        setInviteLoading(true);

        const authHeader = {
            "Authorization" : `Bearer ${accessToken}`
        }
        const requestBody = {invitedPlayerName};
        
        axios.post(`${domain}/user/invite-player`, requestBody, {headers : {...authHeader, ...ngrokHeader}})
        .then((response)=>{
            setMessage(response.data.message);
            setShowMessage(true);
            socket.emit("add-friend-invite", {receiver : invitedPlayerName});
        })
        .catch((err)=>{
            setInviteLoading(false);
            if(err.response && err.response.status === 501){
                setMessage(err.response.data.errorMessage);
                setShowMessage(true);
            }
            console.log(err.message);
            console.log(err.response?.data.errorMessage);
        })
    }

    function closeSearchPlayer(){
        setSearchPlayerPopup(false);
        setSearchText("");
        setSearchPlayerResult([]);
    }

    // notifications functions
    
    function openNotifications(){
        setNotificationsPopup(true);
    }

    function closeNotifications(){
        setNotificationsPopup(false);
    }

    function copyRoomCode(roomCode){
        navigator.clipboard.writeText(roomCode)
        .then((result)=>{
            setMessage("Room Code Copied To Clipboard");
            setShowMessage(true);
        })
        .catch((err)=>{
            console.log(err.message);
        })
    }

    function acceptGameInvite(roomCode){
        if(!isLoggedIn) return;
        else if(roomCode.length<6){
            setMessage("Room Does Not Exist");
            setShowMessage(true);
            setRoomCode("");
            return;
        }
        socket.emit("join-room", {playerName, roomCode : roomCode.toUpperCase()});
    }
    
    function declineInvite(indexOfRemoval){
        let notificationCode = "";
        setNotificationDetails(prevDetails=>{
            return prevDetails.filter((notification, index)=>{
                if(index !== indexOfRemoval) return true;

                switch(notification.type){
                    case "game-invite":
                        notificationCode = `GI${notification.sender}${notification.roomCode}`;
                        break;
                    default:
                        break;
                }
                return false;
            });
        });

        setUniqueNotifications(prevSet => {
            const newSet = new Set(prevSet);
            newSet.delete(notificationCode);
            return newSet;
        });
    }

    return (
        <div className="landing-container">
            <div className="logo-play-btn">
                <div className="landing-logo-container">
                    <img className="landing-logo-image" src={logo} alt="Logo"/>
                </div>
                <div className="landing-play-btn landing-btn" onClick={handlePlay}>Play</div>
            </div>

            <FriendsList
                setSearchPlayerPopup={setSearchPlayerPopup}
            />
            {searchPlayerPopup && <div className="popup-wrapper">
                <div className="popup-overlay"></div>
                <div className="popup-container" ref={searchPlayerRef}>
                    <div className="search-player-container">
                        <div className="popup-close-btn" onClick={closeSearchPlayer}>
                            <i className="fa-solid fa-xmark"></i>
                        </div>
                        <div className="search-player-input-container">
                            <input className="search-player-input" onChange={handleSearchChange} onKeyDown={handleSearchKeyDown} placeholder="Search Player Name ..." value={searchText}/>
                            <div className="search-btn" onClick={searchPlayers}>
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </div>
                        </div>
                        <div className="search-player-display">
                            {searchedPlayers}
                        </div>
                    </div>
                </div>
            </div>}

            <div className="open-notifications-btn" onClick={openNotifications}>
                <i className="fa-solid fa-bell"></i>
            </div>
            {notificationsPopup && <div className="popup-wrapper">
                <div className="popup-overlay"></div>
                <div className="popup-container notifications-wrapper" ref={notificationPopupRef}>
                    <div className="notifications-container">
                        <div className="popup-close-btn" onClick={closeNotifications}>
                            <i className="fa-solid fa-xmark"></i>
                        </div>
                        <div className="notifications-header">Notifications</div>
                        <div className="notifications-display">
                            {notifications}
                        </div>
                    </div>
                </div>
            </div>}

            <div className="landing-buttons-container">
                <div className="player-name-setting">
                    <div className="player-name-property">Player Name</div>
                    <div className="player-name-value-container" ref={playerNameRef}>
                        {!editName && <div className="player-name-value">
                           {isLoggedIn ? playerName : "player123"}
                        </div>}
                        {editName && <input className="player-name-input" onChange={handleNameChange} value={changedName}/>}
                        <div className="player-name-edit" onClick={toggleEditName}>
                            {editName ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-pen-to-square"></i>}
                        </div>
                    </div>
                </div>

                <div className="landing-login-btn landing-btn" onClick={toggleLoginPopup}>{isLoggedIn ? "Log Out" : "Log In"}</div>
            </div>

            <div className={`popup${loginPopup ? "" : " display-none"}`}>
                <div className="popup-overlay"></div>
                <div className="popup-container signin-wrapper" ref={loginRef}>
                    {!signupPopup && <div className="signin-area">
                        <div className={signinLoadingClass}></div>
                        <div className={signinOverlayClass}></div>
                        <div className="signin-header">Sign In</div>
                        <div className={signinInvalidClass}>Invalid Username/Password</div>
                        <div className="signin-username">
                            <label htmlFor="signin-username" className={usernameLabelClass}>Username</label>
                            <input type="text" id="signin-username" name="userName" className="signin-username-input" value={signinDetails.userName} onChange={handleSigninChange} onFocus={handleUsernameFocus} onBlur={handleUsernameBlur} autoComplete="off"/>
                        </div>
                        <div className="signin-password">
                            <label htmlFor="signin-password" className={passwordLabelClass}>Password</label>
                            <input type={showPassword ? "text" : "password"} id="signin-password" name="password" className="signin-password-input" value={signinDetails.password} onChange={handleSigninChange} onFocus={handlePasswordFocus} onBlur={handlePasswordBlur} onPaste={handlePaste} autoComplete="off" onKeyDown={handleSigninKeyDown}/>
                            <div className={`signin-${showPassword ? "show" : "hide"}-password`} onClick={toggleShowPassword}>
                                {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
                            </div>
                        </div>
                        <button className="signin-btn" onClick={handleSignin}>Sign In</button>
                        <div className="signin-create-account">
                            <span onClick={goToSignup}>Create Account</span>
                        </div>
                    </div>}

                    {signupPopup && <div className="signup-area">
                        <div className="signup-details">
                            <div className="signup-back-icon" onClick={goToSignin}>
                                <i className="fa-solid fa-arrow-left-long"></i>
                            </div>
                            <div className={signupLoadingClass}></div>
                            <div className={signupOverlayClass}></div>
                            <div className="signup-header">Sign Up</div>
                            <div className={invalidUserClass}>{invalidUserText}</div>
                            <div className="signup-username">
                                <label htmlFor="signup-username" className={usernameLabelClassSignup}>Username</label>
                                <input type="text" id="signup-username" name="userName" className="signup-username-input" value={signupDetails.userName} onChange={handleSignupChange} onFocus={handleUsernameSignupFocus} onBlur={handleUsernameSignupBlur} />
                            </div>

                            <div className="signup-password">
                                {showPassword && <div className="signup-show-password" onClick={toggleShowPassword}>
                                    <i className="fa-solid fa-eye"></i>
                                </div>}
                                {!showPassword && <div className="signup-hide-password" onClick={toggleShowPassword}>
                                    <i className="fa-solid fa-eye-slash"></i>
                                </div>}
                                <label htmlFor="signup-password" className={passwordLabelClassSignup}>Password</label>
                                <input type={showPassword ? "text" : "password"} id="signup-password" name="password" className="signup-password-input" autoComplete="new-password" value={signupDetails.password} onChange={handleSignupChange} onFocus={handlePasswordSignupFocus} onBlur={handlePasswordSignupBlur} onPaste={handlePaste}/>
                            </div>

                            <div className="signup-confirm-password">
                                <label htmlFor="signup-confirm-password" className={confirmPasswordLabelClassSignup}>Confirm Password</label>
                                <input type="password" id="signup-confirm-password" name="confirmPassword" className="signup-confirm-password-input" value={signupDetails.confirmPassword} onChange={handleSignupChange} onFocus={handleConfirmPasswordFocus} onBlur={handleConfirmPasswordBlur}  onPaste={handlePaste}/>
                            </div>

                            <button className="signup-btn" onClick={handleSignup}>Sign Up</button>
                        </div>
                    </div>}
                </div>
            </div>

            <div className={`popup${joinCreatePopup ? "" : " display-none"}`}>
                <div className="popup-overlay"></div>
                <div className="popup-container" ref={joinCreateRef}>
                    <div className="join-create-container">
                        <div className="popup-close-btn" onClick={closeJoinCreatePopup}>
                            <i className="fa-solid fa-xmark"></i>
                        </div>
                        {!enterRoomCode && <div className="join-create-btn">
                            <div className="join-room" onClick={()=>{setEnterRoomCode(true)}}>Join</div>
                            <div className="create-room" onClick={goToCreateRoom}>Create</div>
                        </div>}
                        {enterRoomCode && <div className="enter-room-code">
                            <div className="enter-code-header">Join Game</div>
                            <div className="enter-code-info">Enter Room Code Below</div>
                            <input type="text" className="enter-code-input" onChange={handleCodeChange} value={roomCode} onKeyDown={handleJoinKeyDown}/>
                            <div className="submit-room-code" onClick={checkRoomCode}>Join</div>
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Landing;