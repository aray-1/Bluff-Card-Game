import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../../providers/AppContext";
import "./CreateRoom.css";

function CreateRoom(){

    const { setPath, logo, playerName, socket } = useContext(AppContext);
    const [maxPlayers, setMaxPlayers] = useState(5);
    const [cardsPerPlayer, setCardsPerPlayer] = useState(7);
    const [cardDecks, setCardDecks] = useState(1);
    const [bluffTime, setBluffTime] = useState(20);
    const [cardPlayTime, setCardPlayTime] = useState(30);

    useEffect(()=>{
        socket.on("create-success", (data)=>{
            console.log(data.message);
            setPath(prevState => {
                return {
                    ...prevState,
                    pathname : "/game-room",
                    state : {
                        roomCode : data.roomCode,
                        gameSettings : data.gameSettings,
                        myCards : data.myCards,
                        players : data.players
                    }
                };
            });
        });

        return ()=>{
            socket.removeAllListeners("create-success");
        }
    },[socket]);

    function increasePlayers(){
        setMaxPlayers(prevCount=>{
            if(prevCount >= 8) return prevCount;
            if(Math.floor((cardDecks * 52) / (prevCount + 1)) < cardsPerPlayer) setCardsPerPlayer(Math.floor((cardDecks * 52) / (prevCount + 1)));
            return prevCount + 1;
        });
    }

    function decreasePlayers(){
        setMaxPlayers(prevCount => prevCount > 2 ? prevCount - 1 : prevCount);
    }

    function increaseCards(){
        setCardsPerPlayer(prevCount => prevCount < Math.floor((cardDecks * 52) / maxPlayers) ? prevCount + 1 : prevCount);
    }
    
    function decreaseCards(){
        setCardsPerPlayer(prevCount => prevCount > 3 ? prevCount - 1 : prevCount);
    }

    function increaseDeck(){
        setCardDecks(prevCount => prevCount < 3 ? prevCount + 1 : prevCount);
    }

    function decreaseDeck(){
        setCardDecks(prevCount => prevCount > 1 ? prevCount - 1 : prevCount);
    }

    function increaseBluff(){
        setBluffTime(prevTime => prevTime < 30 ? prevTime + 5 : prevTime);
    }

    function decreaseBluff(){
        setBluffTime(prevTime => prevTime > 15 ? prevTime - 5 : prevTime);
    }

    function increaseCardPlaying(){
        setCardPlayTime(prevTime => prevTime < 120 ? prevTime + 15 : prevTime);
    }

    function decreaseCardPlaying(){
        setCardPlayTime(prevTime => prevTime > 30 ? prevTime - 15 : prevTime);
    }

    function createRoom(){
        socket.emit("create-room", {
            maxPlayers,
            cardsPerPlayer,
            cardDecks,
            bluffTime,
            cardPlayTime,
            playerName
        })
    }

    function goToHome(){
        setPath(prevState => {
            return {
                ...prevState,
                pathname: "/"
            }
        })
    }

    return (
        <div className="create-room-container">
            <div className="create-room-back-btn" onClick={goToHome}>
                <i className="fa-solid fa-left-long"></i>
            </div>

            <div className="create-room-logo-container">
                <img className="create-room-logo-image" src={logo} alt="Logo"/>
            </div>

            <div className="room-details-container">
                <div className="room-details">
                    <div className="max-players form-field">
                        <div className="max-players-property property">Max. Players :</div>
                        <div className="max-players-increase increase" onClick={decreasePlayers}>
                            <i className="fa-solid fa-minus"></i>
                        </div>
                        <div className="max-players-value value">{maxPlayers}</div>
                        <div className="max-players-decrease decrease" onClick={increasePlayers}>
                            <i className="fa-solid fa-plus"></i>
                        </div>
                    </div>
                    <div className="cards-per-player form-field">
                        <div className="cards-player-property property">Cards Per Player :</div>
                        <div className="cards-player-increase increase" onClick={decreaseCards}>
                            <i className="fa-solid fa-minus"></i>
                        </div>
                        <div className="cards-player-value value">{cardsPerPlayer}</div>
                        <div className="cards-player-decrease decrease" onClick={increaseCards}>
                            <i className="fa-solid fa-plus"></i>
                        </div>
                    </div>

                    <div className="card-decks form-field">
                        <div className="card-decks-property property">Card Decks :</div>
                        <div className="card-decks-increase increase" onClick={decreaseDeck}>
                            <i className="fa-solid fa-minus"></i>
                        </div>
                        <div className="card-decks-value value">{cardDecks}</div>
                        <div className="card-decks-decrease decrease" onClick={increaseDeck}>
                            <i className="fa-solid fa-plus"></i>
                        </div>
                    </div>

                    <div className="bluff-time form-field">
                        <div className="bluff-time-property property">Bluff Time :</div>
                        <div className="bluff-time-increase increase" onClick={decreaseBluff}>
                            <i className="fa-solid fa-minus"></i>
                        </div>
                        <div className="bluff-time-value value">{bluffTime} s</div>
                        <div className="bluff-time-decrease decrease" onClick={increaseBluff}>
                            <i className="fa-solid fa-plus"></i>
                        </div>
                    </div>

                    <div className="card-playing-time form-field">
                        <div className="card-playing-time-property property">Card Playing Time :</div>
                        <div className="card-playing-time-increase increase" onClick={decreaseCardPlaying}>
                            <i className="fa-solid fa-minus"></i>
                        </div>
                        <div className="card-playing-time-value value">{cardPlayTime} s</div>
                        <div className="card-playing-time-decrease decrease" onClick={increaseCardPlaying}>
                            <i className="fa-solid fa-plus"></i>
                        </div>
                    </div>

                    <div className="create-room-btn" onClick={createRoom}>Create</div>
                </div>
            </div>
        </div>
    );
}

export default CreateRoom;