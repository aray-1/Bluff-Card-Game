import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { AppContext } from "../../providers/AppContext";
import ReactConfetti from "react-confetti";
import Utilities from "../../utility-functions";
import "./Game.css";

function Timer(props){

    const { maxTime, setTimedOut, gameOn, timerOn, setTimerOn } = props;
    const timerRef = useRef();
    const [time, setTime] = useState(0);

    useEffect(()=>{
        timerRef.current = timerOn && setInterval(()=>{
            const currentTime = new Date();
            setTime(()=>{
                if(maxTime >= currentTime.getTime()) return Math.ceil((maxTime - currentTime.getTime()) / 1000);
                return 0;
            });
        }, 1000);

        return ()=>{
            clearInterval(timerRef.current);
        }
    },[timerOn, maxTime]);

    useEffect(()=>{
        if(time <= 0 && gameOn){
            setTimerOn(false);
            setTimedOut(true);
        }
    },[time]);
    
    return (
        <div className="timer">
            <div className="timer-text">Time :</div>
            <div className="timer-value">{time} s</div>
        </div>
    );
}

function Card(props){
    const { cardFront, cardBack, cardCode, showCard, cardSelected, hover } = props;
    let styles={};
    if(cardSelected) styles["transform"] = "translateY(-7%) scale(1.15)";

    return (
        <div className={`card-container${hover ? "" : " card-no-hover"}`} style={styles}>
            <div className={`card-inner${showCard ? " show-card" : ""}`}>
                <div className="card-front">
                    <img src={cardFront} alt={cardCode} className="card-front-image"/>
                </div>
                <div className="card-back">
                    <img src={cardBack} alt="Card Back" className="card-back-image"/>
                </div>
            </div>
        </div>
    );
}

function Game(){

    const { path, setPath, cards, cardNames, setMessage, setShowMessage, playerName, socket, setCenterMessage, setShowCenterMessage, myFriendDetails, windowDimension } = useContext(AppContext);
    const cardAnimationTime = 500; // in milliseconds
    const centerMessageTime = 2000 // in milliseconds
    const totalBluffTime = 7000 // in milliseconds

    // useRef Variables
    const selectCardNameRef = useRef();
    const settingsRef = useRef();
    const cardContainerRef = useRef();
    const centerCardCount = useRef();
    const gameChatsRef = useRef();
    const gameChatDisplayRef = useRef();
    const gameChatInputRef = useRef();
    const friendsListRef = useRef();
    const updateClaimTimeout1 = useRef();
    const updateClaimTimeout2 = useRef();
    const bluffTimeout1 = useRef();
    const bluffTimeout2 = useRef();
    const bluffOverTimeout = useRef();
    const lostBluffTimeout = useRef();
    const gameStartTimeout = useRef();
    const clearTableTimeout = useRef();
    const gameOverTimeout = useRef();

    // Timer
    const [maxTime, setMaxTime] = useState(0);
    const [timedOut, setTimedOut] = useState(false);
    const [timerOn, setTimerOn] = useState(false);

    // My Player Details
    const [isHost, setIsHost] = useState(false);
    const [myTurn, setMyTurn] = useState(false);
    const [canPass, setCanPass] = useState(false);
    const [myCardDetails, setMyCardDetails] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [placeCardName, setPlaceCardName] = useState("");

    // Popups
    const [selectCardNamePopup, setSelectCardNamePopup] = useState(false);
    const [settingsPopup, setSettingsPopup] = useState(false);
    const [bluffPopup, setBluffPopup] = useState(false);
    const [gameChatPopup, setGameChatPopup] = useState(false);
    const [friendsListPopup, setFriendsListPopup] = useState(false);

    // Bluff details
    const [bluffCaller, setBluffCaller] = useState("");
    const [bluffCardDetails, setBluffCardDetails] = useState([]);
    const [canBluff, setCanBluff] = useState(false);
    const [bluffCalled, setBluffCalled] = useState(false);
    const [bluffDecision, setBluffDecision] = useState("");

    // Other Game Details
    const [allPlayerDetails, setAllPlayerDetails] = useState([]);
    const [centerCards, setCenterCards] = useState([]);
    const [currentClaim, setCurrentClaim] = useState("");
    const [gameSettings, setGameSettings] = useState([]);
    const [gameSettingDetails, setGameSettingDetails] = useState({});
    const [gameOn, setGameOn] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState("");

    // Game Room Chat
    const [gameChatText, setGameChatText] = useState("");
    const [chatEmptyCharacters, setChatEmptyCharacters] = useState(0);
    const [gameChatDetails, setGameChatDetails] = useState([]);
    const [viewedGameChats, setViewedGameChats] = useState(0);

    // For selectCardNamePopup
    const cardNamesSelect = cardNames.map((cardName)=>{
        return <div key={cardName} className={`name-select-option${placeCardName === cardName ? " selected-name" : ""}`} onClick={()=>{selectPlaceCardName(cardName)}}>{cardName}</div>
    });

    const myCards = useMemo(()=>{
        return myCardDetails.map((card)=>{
            return (
                <div className="card-wrapper" key={Math.ceil(Math.random()*100000)} onClick={()=>{selectCard(card.cardCode)}} onMouseEnter={handleCardHover}>
                    <Card
                        cardFront={cards[card.cardCode.split(" ")[0]]}
                        cardBack={cards["back"]}
                        cardCode={card.cardCode}
                        showCard={card.showCard}
                        cardSelected={selectedCards.includes(card.cardCode)}
                        hover={myTurn && card.showCard}
                    />
                </div>
            );
        })
    },[myCardDetails, selectedCards, myTurn, gameOn, canBluff]);

    const settings = useMemo(()=>{
        return gameSettings.map((setting, index)=>{
            return (
                <div className="setting-container" key={index}>
                    <div className="setting-property">{setting.property}</div>
                    <div className="setting-value-container">
                        {isHost && !gameOn && !gameOver && <div className="setting-value-minus" onClick={()=>{handleGameSettingsChange(setting.varName, "d")}}>
                            <i className="fa-solid fa-minus"></i>
                        </div>}
                        <div className="setting-value">{setting.value}</div>
                        {isHost && !gameOn && !gameOver && <div className="setting-value-plus" onClick={()=>{handleGameSettingsChange(setting.varName, "i")}}>
                            <i className="fa-solid fa-plus"></i>
                        </div>}
                    </div>
                </div>
            );
        })
    },[gameSettings, isHost, gameOn, gameOver]);

    const bluffCards = useMemo(()=>{
        return bluffCardDetails.map((card, index)=>{
            return (
                <div className="bluff-card" key={index}>
                    <Card
                        cardFront={cards[card.cardCode.split(" ")[0]]}
                        cardBack={cards["back"]}
                        cardCode={card.cardCode}
                        showCard={card.showCard}
                        cardSelected={false}
                        hover={false}
                    />
                </div>
            );
        })
    },[bluffCardDetails]);

    const otherPlayers = useMemo(()=>{
        let myPlayerIndex;
        for(let i=0;i<allPlayerDetails.length;i++){
            if(allPlayerDetails[i].playerName === playerName){
                myPlayerIndex = i;
                break;
            }
        }

        let players=[];
        for(let i=0;i<allPlayerDetails.length;i++){
            if(i === myPlayerIndex) continue;
            players.push(
                <div className={`player-container player-${i < myPlayerIndex ? 8 + i - myPlayerIndex : i - myPlayerIndex}`} key={Math.ceil(Math.random()*1000)}>
                    <div className={`player${allPlayerDetails[i].playerActive ? " player-active" : ""}`}>
                        <div className="player-name">{allPlayerDetails[i].playerName}</div>
                        <div className="player-card-count-wrapper">
                            <div className="player-card-count-container">
                                <div className="player-card-count-back"></div>
                                <div className="player-card-count-front">{allPlayerDetails[i].playerCardCount}</div>
                            </div>
                        </div>
                    </div>
                </div> 
            )
        }
        return players;
    }, [allPlayerDetails]);

    const gameChats = useMemo(()=>{
        return gameChatDetails.map((chat)=>{
            return (
                <div className={`game-chat${chat.sender === playerName ? " my-chat" : ""}`} key={Math.ceil(Math.random()*1000000)}>
                    {chat.sender !== playerName && <div className="game-chat-sender">{chat.sender}</div>}
                    <div className="game-chat-body">{chat.body}</div>
                </div>
            );
        });
    },[gameChatDetails]);

    const friends = useMemo(()=>{
        return myFriendDetails.map((friend)=>{
            return (
                <div className={`invite-friend-container-${friend.online ? "active" : "inactive" }`} key={Math.ceil(Math.random()*10000)}>
                    <div className="invite-friend-name">{friend.playerName}</div>
                    <div className="friend-game-invite" onClick={()=>{sendGameInvite(friend)}}>Invite</div>
                </div>
            );
        });
    },[myFriendDetails]);

    useEffect(()=>{
        console.log("hello");
    },[myFriendDetails])

    useEffect(()=>{
        socket.on("disconnect", ()=>{
            setPath(prevState => {
                return {
                    ...prevState,
                    pathname : "/"
                }
            });
        });

        socket.on("new-join", (data)=>{
            console.log(data.message);
            setAllPlayerDetails(data.players);
        });

        socket.on("game-started", (data)=>{
            setCenterMessage(`${data.activePlayer === playerName ? "You" : data.activePlayer} Will Start The Game`);
            setShowCenterMessage(true);
            setGameOn(true);
            setGameOver(false);
            setWinner("");
            setAllPlayerDetails(data.players);

            const myPlayer = data.players.find((player)=>{
                if(player.playerName === playerName) return true;
                return false;
            });

            setMyTurn(myPlayer.playerActive);

            gameStartTimeout.current = setTimeout(()=>{
                setMaxTime(data.cardPlayTime);
                setTimerOn(true);
                setTimedOut(false);
            }, centerMessageTime);
        });

        socket.on("game-reset", (data)=>{
            // timer reset
            setMaxTime(0);
            setTimerOn(false);
            setTimedOut(false);

            // my player reset
            const myPlayer = data.players.find((player)=>{
                if(player.playerName === playerName) return true;
                return false;
            });
            setIsHost(myPlayer.playerHost);
            const myCards = data.myCards.map((card)=>{
                return {
                    cardCode : card,
                    showCard : false
                }
            });
            setMyTurn(false);
            setMyCardDetails(myCards);
            setSelectedCards([]);
            setPlaceCardName("");

            // bluff details reset
            setBluffCaller("");
            setBluffCardDetails([]);
            setCanBluff(false);
            setBluffCalled(false);
            setBluffDecision("");

            // other details reset
            setAllPlayerDetails(data.players);
            setCenterCards([]);
            setCurrentClaim("");
            setGameOn(false);
            setGameOver(false);
            setWinner("");
            centerCardCount.current = 0;
        });

        socket.on("start-failure", (data)=>{
            setMessage(data.message);
            setShowMessage(true);
        });

        socket.on("update-cards", (data)=>{
            const myCards = data.myCards.map((card)=>{
                return {
                    cardCode : card,
                    showCard : true
                }
            }).sort(compareCards);
            setMyCardDetails(myCards);
        });

        socket.on("update-claim", (data)=>{
            setTimerOn(false);

            setCurrentClaim(data.claim);
            centerCardCount.current += data.placeCardCount;
            placeCenterCards(data.prevCardCount, data.placeCardCount);
            setAllPlayerDetails(data.players);
            
            updateClaimTimeout1.current = setTimeout(()=>{
                setCenterMessage("Bluff Time !!");
                setShowCenterMessage(true);
                
                updateClaimTimeout2.current = setTimeout(()=>{
                    setCanBluff(true);
                    setMaxTime(data.bluffTime);
                    setTimerOn(true);
                    setTimedOut(false);
                }, centerMessageTime);
            }, cardAnimationTime);
        });

        socket.on("play-card", (data)=>{
            if(bluffCalled) return;

            setAllPlayerDetails(data.players);
            const myPlayer = data.players.find((player)=>{
                if(player.playerName === playerName) return true;
                return false;
            });
    
            setMyTurn(myPlayer ? myPlayer.playerActive : false);

            setMaxTime(data.cardPlayTime);
            setTimerOn(true);
            setTimedOut(false);
        });

        socket.on("passed", (data)=>{

            setSelectCardNamePopup(false);
            setMaxTime(data.cardPlayTime);
            
            setCanBluff(false);
            setAllPlayerDetails(data.players);
            const myPlayer = data.players.find((player)=>{
                if(player.playerName === playerName) return true;
                return false;
            });
            
            setMyTurn(myPlayer.playerActive);

            setTimerOn(true);
            setTimedOut(false);
        });

        socket.on("clear-table", (data)=>{
            setCenterMessage("Table Cleared");
            setShowCenterMessage(true);
            setAllPlayerDetails(data.players);
            const myPlayer = data.players.find((player)=>{
                if(player.playerName === playerName) return true;
                return false;
            });
    
            setMyTurn(myPlayer.playerActive);
            setCanBluff(false);

            setCenterCards([]);
            centerCardCount.current = 0;
            setCurrentClaim("");

            clearTableTimeout.current = setTimeout(()=>{
                setMaxTime(data.cardPlayTime);
                setTimerOn(true);
                setTimedOut(false);
            }, centerMessageTime);
        });

        socket.on("bluff-called", (data)=>{
            setTimedOut(true);
            setTimerOn(false);
            setBluffCalled(true);
            setBluffPopup(true);
            const bluffCards = data.prevCards.map((card)=>{
                return {
                    cardCode : card,
                    showCard : false
                }
            })
            setBluffCardDetails(bluffCards);
            setBluffCaller(data.bluffCaller);

            bluffTimeout1.current = setTimeout(()=>{
                setBluffCardDetails(prevCards=>{
                    return prevCards.map((card)=>{
                        return {
                            ...card,
                            showCard : true
                        };
                    });
                });
                setBluffDecision(data.bluffCheck ? "Correct Guess" : "Wrong Guess");
    
                bluffTimeout2.current = setTimeout(()=>{
                    setBluffPopup(false);
                    setBluffCaller("");
                    setBluffDecision("");
                    setBluffCardDetails([]);
                },5000);
            },2000);
        });

        socket.on("bluff-call-failure", (data)=>{
            setMessage(data.message);
            setShowMessage(true);
        });

        socket.on("lost-bluff", (data)=>{
            lostBluffTimeout.current = setTimeout(()=>{
                const myCards = data.myCards.map((card)=>{
                    return {
                        cardCode : card,
                        showCard : true
                    }
                }).sort(compareCards);
                setMyCardDetails(myCards);
            }, totalBluffTime);
        });

        socket.on("bluff-over", (data)=>{
            bluffOverTimeout.current = setTimeout(()=>{
                setCanBluff(false);
                setBluffCalled(false);
                setCurrentClaim(data.claim);
                setAllPlayerDetails(data.players);
                const myPlayer = data.players.find((player)=>{
                    if(player.playerName === playerName) return true;
                    return false;
                });
        
                setMyTurn(myPlayer.playerActive);
    
                setMaxTime(data.cardPlayTime);
                setTimerOn(true);
                setTimedOut(false);
    
                setCenterCards([]);
                centerCardCount.current = 0;
            },7000);
        });

        socket.on("game-over", (data)=>{
            function declareWinner(){
                setWinner(data.winner);
                setGameOn(false);
                setGameOver(true);
                setTimedOut(true);
                setTimerOn(false);
                return;  
            }

            if(data.winReason === "bluff-call"){
                gameOverTimeout.current = setTimeout(()=>{
                    declareWinner();       
                }, totalBluffTime);
            }
            else declareWinner();
        });

        socket.on("room-left", (data)=>{
            setIsHost(false);
            setPath(prevState => {
                return {
                    ...prevState,
                    pathname : "/"
                }
            });
        });

        socket.on("player-left", (data)=>{
            setAllPlayerDetails(data.players);

            const myPlayer = data.players.find((player)=>{
                if(player.playerName === playerName) return true;
                return false;
            });

            setIsHost(myPlayer.playerHost);
            setMyTurn(myPlayer.playerActive);

            if(data.resetTimer){
                setMaxTime(data.cardPlayTime);
                setTimerOn(true);
                setTimedOut(false);
                setCanBluff(false);
            }
        });

        socket.on("update-game-settings", (data)=>{
            setGameSettings(data.gameSettings);
            let details = {};
            for(let i=0;i<data.gameSettings.length;i++){
                details[data.gameSettings[i].varName] = data.gameSettings[i].value;
            }
            setGameSettingDetails(details);

            const myCards = data.myCards.map((card)=>{
                return {
                    cardCode : card,
                    showCard : false
                }
            }).sort(compareCards);
            setMyCardDetails(myCards);
        });

        socket.on("receive-message", (data)=>{
            setGameChatDetails(prevDetails => [...prevDetails, data.chat]);
        });

        return ()=>{
            socket.removeAllListeners("disconnect");
            socket.removeAllListeners("new-join");
            socket.removeAllListeners("game-started");
            socket.removeAllListeners("game-reset");
            socket.removeAllListeners("start-failure");
            socket.removeAllListeners("update-cards");
            socket.removeAllListeners("update-claim");
            socket.removeAllListeners("play-card");
            socket.removeAllListeners("passed");
            socket.removeAllListeners("clear-table");
            socket.removeAllListeners("bluff-called");
            socket.removeAllListeners("bluff-call-failure");
            socket.removeAllListeners("lost-bluff");
            socket.removeAllListeners("bluff-over");
            socket.removeAllListeners("game-over");
            socket.removeAllListeners("room-left");
            socket.removeAllListeners("player-left");
            socket.removeAllListeners("update-game-settings");
            socket.removeAllListeners("receive-message");
        }

    },[socket, isHost, playerName]);

    useEffect(()=>{
        // after bluff time gets over and canBluff has been changed
        if(timedOut && !canBluff && !bluffCalled && isHost){
            socket.emit("play-card-info", {roomCode : path.state.roomCode});
        }
    },[canBluff, isHost]);

    useEffect(()=>{
        // after bluff time gets over
        if(timedOut && canBluff && !bluffCalled){
            setCanBluff(false);
        }

        // after card placing time is over
        if(timedOut && !canBluff){
            if(myTurn){
                socket.emit("pass-chance", {roomCode : path.state.roomCode});
                setSelectedCards([]);
            }
        }
    }, [timedOut]);

    useEffect(()=>{
        function handleClick(event){
            if(!selectCardNameRef.current?.contains(event.target)) setSelectCardNamePopup(false);
        }
        document.addEventListener("mousedown", handleClick);
        return ()=>{
            document.removeEventListener("mousedown", handleClick);
        }
    });

    useEffect(()=>{
        function handleClick(event){
            if(!settingsRef.current?.contains(event.target)) setSettingsPopup(false);
        }
        document.addEventListener("mousedown", handleClick);
        return ()=>{
            document.removeEventListener("mousedown", handleClick);
        } 
    });

    useEffect(()=>{
        function handleClick(event){
            if(!gameChatsRef.current?.contains(event.target)) setGameChatPopup(false);
        }
        document.addEventListener("mousedown", handleClick);
        return ()=>{
            document.removeEventListener("mousedown", handleClick);
        }
    });

    useEffect(()=>{
        function handleClick(event){
            if(friendsListRef.current && !friendsListRef.current.contains(event.target)){
                closeFriendsList();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return ()=>{
            document.removeEventListener("mousedown", handleClick);
        }
    });

    useEffect(()=>{
        gameChatDisplayRef.current?.scrollTo({
            top : gameChatDisplayRef.current?.scrollHeight
        });
        if(gameChatPopup) setViewedGameChats(gameChats.length);
    },[gameChats, gameChatPopup]);

    useEffect(()=>{
        centerCardCount.current = 0;

        const myCards = path.state.myCards.map((card)=>{
            return {
                cardCode : card,
                showCard : false
            }
        }).sort(compareCards);
        setMyCardDetails(myCards);

        const myPlayer = path.state.players.find((player)=>{
            if(player.playerName === playerName) return true;
            return false;
        });

        setIsHost(myPlayer.playerHost);
        setAllPlayerDetails(path.state.players)

        setGameSettings(path.state.gameSettings);
        let details={}
        for(let i=0;i<path.state.gameSettings.length;i++){
            details[path.state.gameSettings[i].varName] = path.state.gameSettings[i].value;
        }
        setGameSettingDetails(details);

    },[path?.state]);

    useEffect(()=>{
        if(gameChatInputRef.current) resizeTextarea();
    },[gameChatText]);

    function compareCards(a, b){
        // comparison function for sorting cards based on indices of cards in cardCodes
        const cardCodes = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "K", "Q", "J"];
        let a_code = "", b_code = "";
        a_code = a.cardCode.split(" ")[0];
        a_code = a_code.substring(0, a_code.length - 1);
        b_code = b.cardCode.split(" ")[0];
        b_code = b_code.substring(0, b_code.length - 1);

        return cardCodes.indexOf(a_code) - cardCodes.indexOf(b_code);
    }

    function selectCard(cardCode){

        if(!myTurn || !gameOn || canBluff || bluffCalled) return;

        setSelectedCards(prevCards=>{
            if(prevCards.includes(cardCode)){
                return prevCards.filter((card)=>{
                    if(card!==cardCode) return true;
                    return false;
                })
            }
            return [...prevCards, cardCode];
        })
    }

    function selectPlaceCardName(name){
        setPlaceCardName(prevName => prevName===name ? "" : name);
    }

    function handleCardHover(event){
        // bring the card to full view on hover if card is partially visible
        const container = cardContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const cardRect = event.target.getBoundingClientRect();

        if(cardRect.left < containerRect.left || cardRect.right > containerRect.right){
            container.scrollTo({
                behavior : "smooth",
                left : cardRect.left - containerRect.left + container.scrollLeft
            })
        }
    }

    function closeCardNamePopup(){
        setSelectCardNamePopup(false);
    }

    function selectCardName(){
        if(!myTurn){
            setMessage("Wait For Your Turn");
            setShowMessage(true);
            return;
        }
        else if(canBluff || bluffCalled){
            setMessage("Wait For Bluff To Get Over");
            setShowMessage(true);
            return;
        }
        else if(selectedCards.length === 0){
            setMessage("Select Some Cards To Place!");
            setShowMessage(true);
            return;
        }

        if(currentClaim.length === 0) setSelectCardNamePopup(true);
        else{
            setTimerOn(false);
            socket.emit("set-claim", {
                roomCode : path.state.roomCode,
                claim : `${currentClaim.split("(")[0]}(${selectedCards.length})`,
                prevCards : selectedCards
            });
            setSelectedCards([]);
            setPlaceCardName("");
        }
    }

    function placeCards(){
        if(placeCardName.length > 0){
            setSelectCardNamePopup(false);
            setTimerOn(false);
            socket.emit("set-claim", {
                roomCode : path.state.roomCode,
                claim : `${placeCardName}(${selectedCards.length})`,
                prevCards : selectedCards
            });
            setSelectedCards([]);
            setPlaceCardName("");
        }
    }

    function callBluff(){
        if(!canBluff){
            setMessage("You cannot bluff now!");
            setShowMessage(true);
            return;
        }

        socket.emit("call-bluff", {
            roomCode : path.state.roomCode,
            playerName
        });
    }

    function placeCenterCards(prevCount, newCount){
        let oldCards=[],newCards=[];
        for(let i=0;i<prevCount;i++){
            oldCards.push(
                <div className="center-card"style={{"--rotate-angle" : `${Utilities.randomAngle(-15,15,i)}deg`}} key={Math.ceil(Math.random()*10000)}>
                    <img className="center-card-image" src={cards["back"]} alt="Card Back" />
                </div>
            );
        }
        for(let i=0;i<newCount;i++){
            newCards.push(
                <div className="center-card-new" style={{"--rotate-angle" : `${Utilities.randomAngle(-15,15,i+prevCount)}deg`}} key={Math.ceil(Math.random()*10000)}>
                    <img className="center-card-image" src={cards["back"]} alt="Card Back" />
                </div>
            );
        }
        setCenterCards([...oldCards, ...newCards]);
    }

    function passTurn(){
        if(canBluff || currentClaim.length === 0) return;
        socket.emit("pass-chance", {roomCode : path.state.roomCode});
        setSelectedCards([]);
    }

    function openSettings(){
        setSettingsPopup(true);
    }

    function leaveGame(){
        socket.emit("leave-room", {roomCode : path.state.roomCode});
    }

    function startGame(){
        socket.emit("start-game", {roomCode : path.state.roomCode});
    }

    function resetGame(){
        socket.emit("reset-game", {roomCode : path.state.roomCode});
    }

    function openGameChats(){
        setGameChatPopup(true);
        setViewedGameChats(gameChatDetails.length);
    }

    function handleGameChatChange(event){
        const emptyCharacters = [" ", "\n"];
        const newChatText = event.target.value;

        if(newChatText.length > gameChatText.length && emptyCharacters.includes(newChatText[newChatText.length - 1])){
            setChatEmptyCharacters(prevCount => prevCount + 1);
        }
        else if(newChatText.length < gameChatText.length && emptyCharacters.includes(gameChatText[gameChatText.length - 1])){
            setChatEmptyCharacters(prevCount => prevCount - 1);
        }

        setGameChatText(newChatText);
    }

    function resizeTextarea(){
        //Height adjustment of textarea
        gameChatInputRef.current.style.height = "auto";

        const gameChatContainerRect = gameChatsRef.current.getBoundingClientRect();
        const containerHeight = `${Math.ceil(gameChatContainerRect.bottom - gameChatContainerRect.top)}px`;
        const scrollHeight = `${gameChatInputRef.current.scrollHeight}px`;

        gameChatInputRef.current.style.height = `min(0.25 * ${containerHeight}, ${scrollHeight})`;
        gameChatInputRef.current.scrollTo({top : gameChatInputRef.current.scrollHeight});
    }

    function handleChatKeyDown(event){
        if(event.key === "Enter" && event.ctrlKey){
            // for new line character
            event.preventDefault();
            const currentCursorPosition = event.target.selectionStart;
            const inputValue = event.target.value;
            const newInputValue = inputValue.substring(0, currentCursorPosition) + "\n" + inputValue.substring(currentCursorPosition);
            handleGameChatChange({target : {value : newInputValue}});
        }
        else if(event.key === "Enter"){
            event.preventDefault();
            sendChat();
        }
    }

    function sendChat(){
        if(gameChatText.length === 0  || gameChatText.length === chatEmptyCharacters) return;
        socket.emit("send-message", {roomCode : path.state.roomCode, chat : {sender : playerName, body : gameChatText}});
        setGameChatText("");
    }

    function changeGameSettings(varName, value){
        const changedSetting = {
            varName,
            value
        };
        socket.emit("change-game-settings", {roomCode : path.state.roomCode, changedSetting});
    }

    function handleGameSettingsChange(varName, mode){
        // varName gives the property name
        // mode gives whether to increase or decrease
        // i -> increase And d -> decrease
        if(mode === "i"){
            switch(varName){
                case "maxPlayers":
                    increasePlayers();
                    break;
                case "cardsPerPlayer":
                    increaseCards();
                    break;
                case "cardDecks":
                    increaseDeck();
                    break;
                case "bluffTime":
                    increaseBluff();
                    break;
                case "cardPlayTime":
                    increaseCardPlay();
                    break;
                default:
                    break;
            }
        }
        else if(mode === "d"){
            switch(varName){
                case "maxPlayers":
                    decreasePlayers();
                    break;
                case "cardsPerPlayer":
                    decreaseCards();
                    break;
                case "cardDecks":
                    decreaseDeck();
                    break;
                case "bluffTime":
                    decreaseBluff();
                    break;
                case "cardPlayTime":
                    decreaseCardPlay();
                    break;
                default:
                    break;
            }
        }
    }

    function increasePlayers(){
        if(gameSettingDetails["maxPlayers"] < 8){
            changeGameSettings("maxPlayers", gameSettingDetails["maxPlayers"] + 1);
        }
    }

    function decreasePlayers(){
        if(gameSettingDetails["maxPlayers"] > allPlayerDetails.length && gameSettingDetails["maxPlayers"] > 2){
            changeGameSettings("maxPlayers", gameSettingDetails["maxPlayers"] - 1);
        }
    }

    function increaseCards(){
        if(gameSettingDetails["cardsPerPlayer"] < Math.floor((gameSettingDetails["cardDecks"] * 52) / gameSettingDetails["maxPlayers"])){
            changeGameSettings("cardsPerPlayer", gameSettingDetails["cardsPerPlayer"] + 1);
        }
    }
    
    function decreaseCards(){
        if(gameSettingDetails["cardsPerPlayer"] > 3){
            changeGameSettings("cardsPerPlayer", gameSettingDetails["cardsPerPlayer"] - 1);
        }
    }

    function increaseDeck(){
        if(gameSettingDetails["cardDecks"] < 3){
            changeGameSettings("cardDecks", gameSettingDetails["cardDecks"] + 1);
        }
    }

    function decreaseDeck(){
        if(gameSettingDetails["cardDecks"] > 1){
            changeGameSettings("cardDecks", gameSettingDetails["cardDecks"] - 1);
        }
    }

    function increaseBluff(){
        if(gameSettingDetails["bluffTime"] < 30){
            changeGameSettings("bluffTime", gameSettingDetails["bluffTime"] + 5);
        }
    }

    function decreaseBluff(){
        if(gameSettingDetails["bluffTime"] > 15){
            changeGameSettings("bluffTime", gameSettingDetails["bluffTime"] - 5);
        }
    }

    function increaseCardPlay(){
        if(gameSettingDetails["cardPlayTime"] < 120){
            changeGameSettings("cardPlayTime", gameSettingDetails["cardPlayTime"] + 15);
        }
    }

    function decreaseCardPlay(){
        if(gameSettingDetails["cardPlayTime"] > 30){
            changeGameSettings("cardPlayTime", gameSettingDetails["cardPlayTime"] - 15);
        }
    }

    // Invite Friend To Game
    function openFriendsList(){
        setSettingsPopup(false);
        setFriendsListPopup(true);
    }

    function closeFriendsList(){
        setFriendsListPopup(false);
        setSettingsPopup(true);
    }

    function sendGameInvite(friend){
        if(!friend.online) return;
        socket.emit("invite-to-game", {playerName : friend.playerName, roomCode : path.state.roomCode});

        setMessage("Game Invite Sent");
        setShowMessage(true);
    }

    return (
        <div className="game-container">
            {gameOver && <div className="confetti-container">
                <ReactConfetti
                    width={windowDimension.width * 0.9}
                    height={windowDimension.height}
                />
            </div>}
            {gameOver && <div className="winner-container">
                {winner === playerName ? "You" : winner} Won The Game
            </div>}

            <div className="settings-btn" onClick={openSettings}>
                <i className="fa-solid fa-gear"></i>
            </div>
            <div className="game-chat-btn" onClick={openGameChats}>
                <div>
                    {gameChatDetails.length > viewedGameChats && <div className="new-chats"></div>}
                    <i className="fa-solid fa-message"></i>
                    <div className="chat-line-1"></div>
                    <div className="chat-line-2"></div>
                    <div className="chat-line-3"></div>
                </div>
            </div>

            {isHost && !gameOn && !gameOver && <div className="start-btn" onClick={startGame}>Start</div>}
            {isHost && !gameOn && gameOver && <div className="reset-btn" onClick={resetGame}>Reset</div>} 

            {settingsPopup && <div className="popup-wrapper settings-popup-wrapper">
                <div className="popup-overlay"></div>
                <div className="popup-container settings-popup" ref={settingsRef}>
                    <div className="game-information">
                        {settings}
                    </div>
                    <div className="room-code">{path.state.roomCode}</div>
                    <div className="setting-buttons">
                        {isHost && !gameOn && !gameOver && <div className="game-invite-btn" onClick={openFriendsList}>Invite</div>}
                        <div className="leave-game-btn" onClick={leaveGame}>Leave Game</div>
                    </div>
                </div>
            </div>}

            {friendsListPopup && <div className="popup-wrapper">
                <div className="popup-overlay"></div>
                <div className="popup-container" ref={friendsListRef}>
                    <div className="game-invite-container">
                        <div className="popup-close-btn" onClick={closeFriendsList}>
                            <i className="fa-solid fa-xmark"></i>
                        </div>
                        <div className="invite-friends">
                            {friends}
                        </div>
                    </div>
                </div>
            </div>}

            {gameChatPopup && <div className="popup-wrapper">
                <div className="popup-overlay"></div>
                <div className="popup-container game-chats-container" ref={gameChatsRef}>
                    <div className="game-chats-display" ref={gameChatDisplayRef}>
                        {gameChats}
                    </div>
                    <div className="game-chat-text">
                        <textarea rows={1} className="game-chat-input" placeholder="Message" onChange={handleGameChatChange} value={gameChatText} onKeyDown={handleChatKeyDown} ref={gameChatInputRef}/>
                        <div className="game-chat-send-btn" onClick={sendChat}>
                            <i className="fa-solid fa-paper-plane"></i>
                        </div>
                    </div>
                </div>
            </div>}

            <div className="my-cards-container" style={myCards.length > 7 ? {"overflowX" : "auto", "overflowY" : "hidden"} : {}} ref={cardContainerRef}>
                {myCards}
            </div>

            <div className="player-buttons">
                <div className="button-box1">
                    <div className="timer-container">
                        <Timer
                            maxTime={maxTime}
                            setTimedOut={setTimedOut}
                            gameOn={gameOn}
                            timerOn={timerOn}
                            setTimerOn={setTimerOn}
                        />
                    </div>
                    <div className={`bluff-btn-${canBluff ? "active" : "inactive"}`} onClick={callBluff}>Call Bluff</div>
                </div>
                <div className="button-box2">
                    <div className={`play-card-btn-${!myTurn || selectedCards.length === 0 ? "inactive" : "active"}`} onClick={selectCardName}>Place Card</div>
                    <div className={`pass-btn-${myTurn && !canBluff && currentClaim.length > 0 ? "active" : "inactive"}`} onClick={passTurn}>Pass</div>
                </div>
            </div>

            <div className="card-place-area">
                <div className="center-cards-container">
                    {centerCards}
                </div>
            </div>
            <div className="current-claim-area">
                <div className="current-claim-header">Current Claim</div>
                <div className="current-claim-value">{currentClaim}</div>
            </div>

            {otherPlayers}
            
            <div className="my-player-container">
                <div className={`my-player${myTurn ? " player-active" : ""}`}>
                    <div className="my-player-name">{playerName}</div>
                    <div className="my-player-card-count-wrapper">
                        <div className="my-player-card-count-container">
                            <div className="my-player-card-count-back"></div>
                            <div className="my-player-card-count-front">{myCardDetails.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {selectCardNamePopup && <div className="popup-wrapper">
                <div className="popup-overlay"></div>
                <div className="popup-container name-select-container" ref={selectCardNameRef}>
                    <div className="name-select-header">
                        <div className="name-select-header-text">Select Card Name To Display</div>
                        <div className="name-select-close-btn" onClick={closeCardNamePopup}>
                            <i className="fa-solid fa-xmark"></i>
                        </div>
                    </div>
                    <div className="name-select-row">
                        {cardNamesSelect.slice(0,5)}
                    </div>
                    <div className="name-select-row">
                        {cardNamesSelect.slice(5,10)}
                    </div>
                    <div className="name-select-row">
                        {cardNamesSelect.slice(10)}
                    </div>
                    <div className={`confirm-name-btn-${placeCardName.length > 0 ? "active" : "inactive"}`} onClick={placeCards}>Confirm</div>
                </div>
            </div>}

            {bluffPopup && <div className="popup-wrapper">
                <div className="popup-overlay"></div>
                <div className="popup-container bluff-popup">
                    <div className="bluff-popup-header">{bluffCaller} Called Bluff</div>
                    <div className="bluff-cards-container">{bluffCards}</div>
                    <div className="bluff-decision">{bluffDecision}</div>
                </div>
            </div>}
        </div>
    );
}

export default Game;