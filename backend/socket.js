const cards = [
                "AC", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C", "KC", "QC", "JC",
                "AS", "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "10S", "KS", "QS", "JS",
                "AD", "2D", "3D", "4D", "5D", "6D", "7D", "8D", "9D", "10D", "KD", "QD", "JD",
                "AH", "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "10H", "KH", "QH", "JH"
            ];

const cardAnimationTime = 500; // in milliseconds
const centerMessageTime = 2000 // in milliseconds
const totalBluffTime = 7000 // in milliseconds

function shuffleCards(decks, playerCount, cardsPerPlayer){
    let allCards = [], playerCards = [];
    let player = 0;

    // combine cards from decks and generate a random shuffle
    for(let i=1;i<=decks;i++){
        allCards = allCards.concat(cards.map(card => [card + ` ${i}`, Math.ceil(Math.random()*100000)]));
    }
    allCards.sort((a, b) => a[1]-b[1]);
    
    // split the cards between players
    for(let i=0;i<playerCount;i++) playerCards.push([]);

    for(let i=0;i<playerCount * cardsPerPlayer; i++){
        playerCards[player].push(allCards[i][0]);
        if(player === playerCount-1) player=0;
        else player++;
    }

    return playerCards;
}

function generateRoomCode(length){
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code="";
    for(let i=0;i<length;i++) code+=characters[Math.floor(Math.random()*characters.length)];
    return code;
}

function findRoom(roomCode){
    let index = null;
    for(let i=0;i<rooms.length;i++){
        if(rooms[i].roomCode === roomCode){
            index = i;
            break;
        }
    }
    return index;
}

let rooms = [];
let users = {};
const loggedUsers = {};

const handle_connect = (io, socket)=>{
    users[socket.id] = {
        roomCode : "",
        playerName : ""
    }
}

const handle_login = (io, socket, data)=>{
    users[socket.id].playerName = data.playerName;
    loggedUsers[data.playerName] = {
        socketID : socket.id
    };
    io.emit("player-logged-in", {playerName : data.playerName});
}

const handle_logout = (io, socket, data)=>{
    const playerName = users[socket.id].playerName;
    users[socket.id].playerName = "";
    delete loggedUsers[playerName];
    io.emit("player-logged-out", {playerName});
}

const create_room = (io, socket, data)=>{
    const roomCode = generateRoomCode(6);
    socket.join(roomCode);
    users[socket.id]["roomCode"] = roomCode;
    console.log(`Room created with room code : ${roomCode}`);

    const gameSettings = [
        {
            property : "Max Player",
            varName : "maxPlayers",
            value : data.maxPlayers
        },
        {
            property : "Cards Per Player",
            varName : "cardsPerPlayer",
            value : data.cardsPerPlayer
        },
        {
            property : "Card Decks",
            varName : "cardDecks",
            value : data.cardDecks
        },
        {
            property : "Bluff Time",
            varName : "bluffTime",
            value : data.bluffTime
        },
        {
            property : "Card Playing Time",
            varName : "cardPlayTime",
            value : data.cardPlayTime
        }
    ]
    const newRoom = {
        roomCode,
        gameCards : [],
        gameOn : false,
        bluffCalled : false,
        bluffCaller : "",
        prevPlayerName : "",
        probableWinner : "",
        passCount : 0,
        maxPlayers : data.maxPlayers,
        cardsPerPlayer : data.cardsPerPlayer,
        cardDecks : data.cardDecks,
        bluffTime : data.bluffTime,
        cardPlayTime : data.cardPlayTime,
        currentClaim : "",
        prevCards : [],
        allPrevCards : [],
        players : [
            {
                playerSocketID : socket.id,
                playerName : data.playerName,
                playerHost : true,
                playerActive : false,
                playerCardCount : data.cardsPerPlayer,
                playerCards : []
            }
        ],
        playersIn : 1
    }

    rooms.push(newRoom);
    const players = [{
        playerName : data.playerName,
        playerActive : false,
        playerHost : true,
        playerCardCount : data.cardsPerPlayer
    }];
    socket.emit("create-success", {
        message : "Room Created",
        roomCode,
        myCards : cards.slice(0, data.cardsPerPlayer),
        gameSettings,
        players
    });
}

const join_room = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    
    if(roomIndex === null){
        socket.emit("join-failure", {message : "Room Does Not Exist"});
        return;
    }
    else if(rooms[roomIndex].playersIn === rooms[roomIndex].maxPlayers){
        socket.emit("join-failure", {message : "Room Is Already Full"});
        return;
    }
    else if(rooms[roomIndex].gameOn){
        socket.emit("join-failure", {message : "Game Has Already Started"});
        return;
    }

    let existingPlayerIndex = null;
    for(let i=0;i<rooms[roomIndex].players.length;i++){
        if(rooms[roomIndex].players[i].playerName === data.playerName){
            existingPlayerIndex = i;
            break;
        }
    }

    const gameSettings = [
        {
            property : "Max Player",
            varName : "maxPlayers",
            value : rooms[roomIndex].maxPlayers
        },
        {
            property : "Cards Per Player",
            varName : "cardsPerPlayer",
            value : rooms[roomIndex].cardsPerPlayer
        },
        {
            property : "Card Decks",
            varName : "cardDecks",
            value : rooms[roomIndex].cardDecks
        },
        {
            property : "Bluff Time",
            varName : "bluffTime",
            value : rooms[roomIndex].bluffTime
        },
        {
            property : "Card Playing Time",
            varName : "cardPlayTime",
            value : rooms[roomIndex].cardPlayTime
        }
    ]

    if(existingPlayerIndex !== null){
        // remove the existing socket from room
        const existingPlayerSocket = io.sockets.sockets.get(rooms[roomIndex].players[existingPlayerIndex].playerSocketID);
        if(existingPlayerSocket && existingPlayerSocket.rooms.has(data.roomCode)){
            existingPlayerSocket.leave(data.roomCode);
        }

        io.to(rooms[roomIndex].players[existingPlayerIndex].playerSocketID).emit("room-left", {message : "New Login Detected"});


        rooms[roomIndex].players[existingPlayerIndex].playerSocketID = socket.id;
        socket.join(data.roomCode);
        users[socket.id]["roomCode"] = data.roomCode;

        const allPlayers = rooms[roomIndex].players.map((player)=>{
            return {
                playerName : player.playerName,
                playerHost : player.playerHost,
                playerActive : player.playerActive,
                playerCardCount : player.playerCardCount
            }
        });
        socket.emit("rejoin-success", {
            roomCode : data.roomCode,
            players : allPlayers,
            myCards : rooms[roomIndex].gameOn ? rooms[roomIndex].players[existingPlayerIndex].playerCards : cards.slice(0, rooms[roomIndex].cardsPerPlayer),
            gameSettings,
            gameOn : rooms[roomIndex].gameOn
        });
        return;
    }

    const newPlayer = {
        playerSocketID : socket.id,
        playerName : data.playerName,
        playerHost : false,
        playerActive : false,
        playerCardCount : rooms[roomIndex].cardsPerPlayer,
        playerCards : []
    }

    rooms[roomIndex].playersIn++;
    rooms[roomIndex].players.push(newPlayer);

    const allPlayers = rooms[roomIndex].players.map((player)=>{
        return {
            playerName : player.playerName,
            playerHost : player.playerHost,
            playerActive : player.playerActive,
            playerCardCount : player.playerCardCount
        }
    });

    socket.join(data.roomCode);
    users[socket.id]["roomCode"] = data.roomCode;
    socket.to(data.roomCode).emit("new-join", {message : "Player Joined", players : allPlayers});
    socket.emit("join-success", {
        message : "Welcome to the game",
        roomCode : data.roomCode,
        players : allPlayers,
        myCards : cards.slice(0, rooms[roomIndex].cardsPerPlayer),
        gameSettings,
        gameOn : rooms[roomIndex].gameOn
    });
}

const start_game = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    const currentTime = new Date();
    if(roomIndex === null) return;
    // if(rooms[roomIndex].playersIn < 2){
    //     console.log("Waiting For Players")
    //     socket.emit("start-failure", {message : "Waiting For Players"});
    //     return;
    // }

    const activePlayer = Math.floor(Math.random()*rooms[roomIndex].playersIn);
    rooms[roomIndex].players[activePlayer].playerActive = true;

    const allPlayers = rooms[roomIndex].players.map((player)=>{
        return {
            playerName : player.playerName,
            playerHost : player.playerHost,
            playerActive : player.playerActive,
            playerCardCount : player.playerCardCount
        }
    });

    const gameCards = shuffleCards(rooms[roomIndex].cardDecks, rooms[roomIndex].playersIn, rooms[roomIndex].cardsPerPlayer);

    for(let i=0;i<rooms[roomIndex].players.length;i++){
        rooms[roomIndex].players[i].playerCards = gameCards[i];
        io.to(rooms[roomIndex].players[i].playerSocketID).emit("update-cards", {myCards : gameCards[i]});
    }

    rooms[roomIndex].gameCards = gameCards;
    rooms[roomIndex].gameOn = true;
    rooms[roomIndex].bluffCalled = false;
    rooms[roomIndex].bluffCaller = "";
    rooms[roomIndex].prevPlayerName = "";
    rooms[roomIndex].probableWinner = "";
    rooms[roomIndex].passCount = 0;
    rooms[roomIndex].currentClaim = "";
    rooms[roomIndex].prevCards = [];
    rooms[roomIndex].allPrevCards = [];

    io.to(data.roomCode).emit("game-started", {
        activePlayer : rooms[roomIndex].players[activePlayer].playerName,
        players : allPlayers,
        cardPlayTime : rooms[roomIndex].cardPlayTime * 1000 + currentTime.getTime() + centerMessageTime
    });
}

const reset_game = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);

    for(let i=0;i<rooms[roomIndex].players.length;i++){
        if(rooms[roomIndex].players[i].playerActive){
            rooms[roomIndex].players[i].playerActive = false;
            break;
        }
    }

    rooms[roomIndex].gameOn = false;

    const allPlayers = rooms[roomIndex].players.map((player)=>{
        return {
            playerName : player.playerName,
            playerHost : player.playerHost,
            playerActive : player.playerActive,
            playerCardCount : player.playerCardCount
        }
    });

    io.to(data.roomCode).emit("game-reset", {
        myCards : cards.slice(0, rooms[roomIndex].cardsPerPlayer),
        players : allPlayers
    });
}

const set_claim = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    const currentTime = new Date();

    if(roomIndex === null) return;
    else if(rooms[roomIndex].bluffCalled) return;

    let playerWin = false;
    let playerActiveIndex = 0;

    for(let i=0;i<rooms[roomIndex].players.length;i++){
        if(rooms[roomIndex].players[i].playerActive){
            playerActiveIndex = i;
            break;
        }
    }

    if(rooms[roomIndex].players[playerActiveIndex].playerSocketID !== socket.id) return;

    rooms[roomIndex].currentClaim = data.claim;
    rooms[roomIndex].prevCards = data.prevCards;
    rooms[roomIndex].allPrevCards = rooms[roomIndex].allPrevCards.concat(data.prevCards);
    rooms[roomIndex].passCount = 0;
    
    const cardsPlaced = parseInt(data.claim.split("(")[1].split(")")[0]);

    rooms[roomIndex].prevPlayerName = rooms[roomIndex].players[playerActiveIndex].playerName;

    rooms[roomIndex].players[playerActiveIndex].playerCards = rooms[roomIndex].players[playerActiveIndex].playerCards.filter((card)=>{
        if(data.prevCards.includes(card)) return false;
        return true;
    })

    rooms[roomIndex].players[playerActiveIndex].playerCardCount = rooms[roomIndex].players[playerActiveIndex].playerCards.length;

    if(rooms[roomIndex].probableWinner !== rooms[roomIndex].prevPlayerName && rooms[roomIndex].probableWinner.length > 0) playerWin = true

    if(rooms[roomIndex].players[playerActiveIndex].playerCardCount === 0 && !playerWin){
        rooms[roomIndex].probableWinner = rooms[roomIndex].players[playerActiveIndex].playerName;
    }

    if(playerWin){
        io.to(data.roomCode).emit("game-over", {winner : rooms[roomIndex].probableWinner, winReason : "card-place"});
        socket.emit("update-cards", {
            myCards : rooms[roomIndex].players[playerActiveIndex].playerCards
        });
        return;
    }
    else{
        const allPlayers = rooms[roomIndex].players.map((player)=>{
            return {
                playerName : player.playerName,
                playerHost : player.playerHost,
                playerActive : player.playerActive,
                playerCardCount : player.playerCardCount
            }
        });

        socket.emit("update-cards", {
            myCards : rooms[roomIndex].players[playerActiveIndex].playerCards
        })
        io.to(data.roomCode).emit("update-claim", {
            claim : rooms[roomIndex].currentClaim,
            players : allPlayers,
            placeCardCount : cardsPlaced,
            prevCardCount : rooms[roomIndex].allPrevCards.length - rooms[roomIndex].prevCards.length >= 0 ? rooms[roomIndex].allPrevCards.length - rooms[roomIndex].prevCards.length : 0,
            bluffTime : rooms[roomIndex].bluffTime * 1000 + currentTime.getTime() + centerMessageTime + cardAnimationTime
        });
    }
}

const play_card_info = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    const currentTime = new Date();

    if(roomIndex === null) return;
    else if(rooms[roomIndex].bluffCalled) return;

    let playerActiveIndex = 0;

    for(let i=0;i<rooms[roomIndex].players.length;i++){
        if(rooms[roomIndex].players[i].playerActive){
            playerActiveIndex = i;
            break;
        }
    }

    rooms[roomIndex].players[playerActiveIndex].playerActive = false;
    rooms[roomIndex].players[playerActiveIndex === rooms[roomIndex].playersIn - 1 ? 0 : playerActiveIndex + 1].playerActive = true;

    const allPlayers = rooms[roomIndex].players.map((player)=>{
        return {
            playerName : player.playerName,
            playerHost : player.playerHost,
            playerActive : player.playerActive,
            playerCardCount : player.playerCardCount
        }
    });

    io.to(data.roomCode).emit("play-card", {
        cardPlayTime : rooms[roomIndex].cardPlayTime * 1000 + currentTime.getTime(),
        players : allPlayers
    });
}

const pass_chance = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    const currentTime = new Date();

    if(roomIndex === null) return;
    else if(rooms[roomIndex].bluffCalled) return;

    let playerActiveIndex = 0;

    for(let i=0;i<rooms[roomIndex].players.length;i++){
        if(rooms[roomIndex].players[i].playerActive){
            playerActiveIndex = i;
            break;
        }
    }

    if(rooms[roomIndex].passCount === rooms[roomIndex].playersIn - 2 && rooms[roomIndex].prevPlayerName === rooms[roomIndex].probableWinner && rooms[roomIndex].probableWinner.length > 0){
        io.to(data.roomCode).emit("game-over", {winner : rooms[roomIndex].probableWinner, winReason : "passed"});
        return;
    }

    if(rooms[roomIndex].passCount === rooms[roomIndex].playersIn - 1 && rooms[roomIndex].currentClaim.length > 0){

        rooms[roomIndex].prevCards = [];
        rooms[roomIndex].allPrevCards = [];
        rooms[roomIndex].currentClaim = "";
        rooms[roomIndex].prevPlayerName = "";

        const allPlayers = rooms[roomIndex].players.map((player)=>{
            return {
                playerName : player.playerName,
                playerHost : player.playerHost,
                playerActive : player.playerActive,
                playerCardCount : player.playerCardCount
            }
        });
        
        io.to(data.roomCode).emit("clear-table", {
            players : allPlayers,
            cardPlayTime : rooms[roomIndex].cardPlayTime * 1000 + currentTime.getTime() + centerMessageTime
        });
    }
    else{
        rooms[roomIndex].passCount+=1;
        rooms[roomIndex].players[playerActiveIndex].playerActive = false;
        rooms[roomIndex].players[playerActiveIndex === rooms[roomIndex].playersIn - 1 ? 0 : playerActiveIndex + 1].playerActive = true;
    
        const allPlayers = rooms[roomIndex].players.map((player)=>{
            return {
                playerName : player.playerName,
                playerHost : player.playerHost,
                playerActive : player.playerActive,
                playerCardCount : player.playerCardCount
            }
        });

        io.to(data.roomCode).emit("passed", {
            players : allPlayers,
            cardPlayTime : rooms[roomIndex].cardPlayTime * 1000 + currentTime.getTime()
        });
    }
}

const get_prev_cards = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    
    if(rooms[roomIndex].prevPlayerName === data.playerName){
        socket.emit("bluff-call-failure", {message : "Cannot Call Bluff On Yourself"});
        return;
    }
    else if(rooms[roomIndex].bluffCalled){
        socket.emit("bluff-call-failure", {message : `Bluff Already Called By ${rooms[roomIndex].bluffCaller}`});
        return;
    }

    const prevCards = rooms[roomIndex].prevCards;

    rooms[roomIndex].bluffCalled = true;
    rooms[roomIndex].bluffCaller = data.playerName;
    
    let check = false, bluffCardCode = "";
    const claim = rooms[roomIndex].currentClaim.split("(")[0];

    for(let i=0;i<prevCards.length;i++){
        bluffCardCode = prevCards[i].split(" ")[0];
        bluffCardCode = bluffCardCode.substring(0, bluffCardCode.length - 1);
        if(bluffCardCode !== claim){
            check = true;
            break;
        }
    }

    io.to(data.roomCode).emit("bluff-called", {
        bluffCaller : data.playerName,
        prevCards,
        prevPlayerName : rooms[roomIndex].prevPlayerName,
        bluffCheck : check
    });

    if(check){
        correct_bluff_guess(io, socket, {roomCode : data.roomCode});
    }
    else{
        wrong_bluff_guess(io, socket, {roomCode : data.roomCode});
    }
}

const correct_bluff_guess = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    const currentTime = new Date();
    if(roomIndex === null) return;

    let prevPlayerIndex = 0, bluffCallerIndex = 0;

    for(let i=0;i<rooms[roomIndex].players.length;i++){
        if(rooms[roomIndex].players[i].playerName === rooms[roomIndex].prevPlayerName) prevPlayerIndex = i;
        if(rooms[roomIndex].players[i].playerName === rooms[roomIndex].bluffCaller) bluffCallerIndex = i;
        
        rooms[roomIndex].players[i].playerActive = false;
    }

    rooms[roomIndex].probableWinner = "";

    rooms[roomIndex].players[prevPlayerIndex].playerCards = rooms[roomIndex].players[prevPlayerIndex].playerCards.concat(rooms[roomIndex].allPrevCards);

    rooms[roomIndex].players[prevPlayerIndex].playerCardCount = rooms[roomIndex].players[prevPlayerIndex].playerCards.length;

    rooms[roomIndex].currentClaim = "";

    io.to(rooms[roomIndex].players[prevPlayerIndex].playerSocketID).emit("lost-bluff", {
        myCards : rooms[roomIndex].players[prevPlayerIndex].playerCards
    });

    rooms[roomIndex].players[bluffCallerIndex].playerActive = true;
    rooms[roomIndex].prevCards = [];
    rooms[roomIndex].allPrevCards = [];
    rooms[roomIndex].bluffCalled = false;
    rooms[roomIndex].bluffCaller = "";

    const allPlayers = rooms[roomIndex].players.map((player)=>{
        return {
            playerName : player.playerName,
            playerHost : player.playerHost,
            playerActive : player.playerActive,
            playerCardCount : player.playerCardCount
        }
    });

    io.to(data.roomCode).emit("bluff-over", {
        claim : rooms[roomIndex].currentClaim,
        players : allPlayers,
        cardPlayTime : rooms[roomIndex].cardPlayTime * 1000 + currentTime.getTime() + totalBluffTime
    });
}

const wrong_bluff_guess = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    const currentTime = new Date();
    if(roomIndex === null) return;

    let prevPlayerIndex = 0, bluffCallerIndex = 0;

    for(let i=0;i<rooms[roomIndex].players.length;i++){
        if(rooms[roomIndex].players[i].playerName === rooms[roomIndex].prevPlayerName) prevPlayerIndex = i;
        if(rooms[roomIndex].players[i].playerName === rooms[roomIndex].bluffCaller) bluffCallerIndex = i;
        
        rooms[roomIndex].players[i].playerActive = false;
    }

    if(rooms[roomIndex].probableWinner.length > 0){
        io.to(data.roomCode).emit("game-over", {winner : rooms[roomIndex].probableWinner, winReason : "bluff-call"});
        return;
    }

    rooms[roomIndex].players[bluffCallerIndex].playerCards = rooms[roomIndex].players[bluffCallerIndex].playerCards.concat(rooms[roomIndex].allPrevCards);

    rooms[roomIndex].players[bluffCallerIndex].playerCardCount = rooms[roomIndex].players[bluffCallerIndex].playerCards.length;

    rooms[roomIndex].currentClaim = "";

    io.to(rooms[roomIndex].players[bluffCallerIndex].playerSocketID).emit("lost-bluff", {
        myCards : rooms[roomIndex].players[bluffCallerIndex].playerCards
    });

    rooms[roomIndex].players[prevPlayerIndex].playerActive = true;
    rooms[roomIndex].prevCards = [];
    rooms[roomIndex].allPrevCards = [];
    rooms[roomIndex].bluffCalled = false;
    rooms[roomIndex].bluffCaller = "";

    const allPlayers = rooms[roomIndex].players.map((player)=>{
        return {
            playerName : player.playerName,
            playerHost : player.playerHost,
            playerActive : player.playerActive,
            playerCardCount : player.playerCardCount
        }
    });

    io.to(data.roomCode).emit("bluff-over", {
        claim : rooms[roomIndex].currentClaim,
        players : allPlayers,
        cardPlayTime : rooms[roomIndex].cardPlayTime * 1000 + currentTime.getTime() + totalBluffTime
    });
}

const leave_room = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    const currentTime = new Date();
    if(roomIndex === null) return;

    let playerIndex = null;
    for(let i=0;i<rooms[roomIndex].players.length;i++){
        if(rooms[roomIndex].players[i].playerSocketID === socket.id){
            playerIndex = i;
            break;
        }
    }

    if(playerIndex === null) return;

    socket.leave(data.roomCode);
    users[socket.id]["roomCode"] = "";
    
    if(rooms[roomIndex].playersIn === 1){
        rooms.splice(roomIndex, 1);
        socket.emit("room-left", {message : "Room Left"});
        return;
    }

    if(rooms[roomIndex].playersIn === 2 && rooms[roomIndex].gameOn){
        io.to(data.roomCode).emit("game-over", {winner : rooms[roomIndex].players[playerIndex === 0 ? 1 : 0].playerName, winReason : "player-left"});
    }

    if(rooms[roomIndex].players[playerIndex].playerActive){
        rooms[roomIndex].players[playerIndex === rooms[roomIndex].playersIn - 1 ? 0 : playerIndex + 1].playerActive = true;
    }

    rooms[roomIndex].playersIn -= 1;
    if(rooms[roomIndex].prevPlayerName === rooms[roomIndex].players[playerIndex].playerName){
        rooms[roomIndex].prevPlayerName = "";
        rooms[roomIndex].prevCards = [];
    }
    if(rooms[roomIndex].probableWinner === rooms[roomIndex].players[playerIndex].playerName) rooms[roomIndex].probableWinner = "";
    
    const leftPlayer = rooms[roomIndex].players.splice(playerIndex, 1);
    if(leftPlayer[0].playerHost) rooms[roomIndex].players[0].playerHost = true;

    const allPlayers = rooms[roomIndex].players.map((player)=>{
        return {
            playerName : player.playerName,
            playerHost : player.playerHost,
            playerActive : player.playerActive,
            playerCardCount : player.playerCardCount
        }
    });

    socket.emit("room-left", {message : "Room Left"});
    socket.to(data.roomCode).emit("player-left", {
        message : `${leftPlayer[0].playerName} Left The Room`,
        players : allPlayers,
        resetTimer : leftPlayer.playerActive,
        cardPlayTime : rooms[roomIndex].cardPlayTime * 1000 + currentTime.getTime(),
        playerCount : rooms[roomIndex].playersIn
    });    
}

const handle_disconnect = (io, socket)=>{
    const roomCode = users[socket.id]["roomCode"];
    const playerName = users[socket.id].playerName;
    delete loggedUsers[playerName];
    io.emit("player-logged-out", {playerName});

    const roomIndex = findRoom(roomCode);
    delete users[socket.id];
    if(roomIndex === null) return;

    let playerIndex = null;
    for(let i=0;i<rooms[roomIndex].players.length;i++){
        if(rooms[roomIndex].players[i].playerSocketID === socket.id){
            playerIndex = i;
            break;
        }
    }

    if(playerIndex === null) return;

    if(rooms[roomIndex].playersIn === 1){
        rooms.splice(roomIndex, 1);
        return;
    }

    if(rooms[roomIndex].playersIn === 2 && rooms[roomIndex].gameOn){
        io.to(roomCode).emit("game-over", {winner : rooms[roomIndex].players[playerIndex === 0 ? 1 : 0].playerName, winReason : "player-disconnect"});
    }

    if(rooms[roomIndex].players[playerIndex].playerActive){
        rooms[roomIndex].players[playerIndex === rooms[roomIndex].playersIn - 1 ? 0 : playerIndex + 1].playerActive = true;
    }

    rooms[roomIndex].playersIn -= 1;
    if(rooms[roomIndex].prevPlayerName === rooms[roomIndex].players[playerIndex].playerName){
        rooms[roomIndex].prevPlayerName = "";
        rooms[roomIndex].prevCards = [];
    }
    if(rooms[roomIndex].probableWinner === rooms[roomIndex].players[playerIndex].playerName) rooms[roomIndex].probableWinner = "";
    
    const leftPlayer = rooms[roomIndex].players.splice(playerIndex, 1);
    if(leftPlayer[0].playerHost) rooms[roomIndex].players[0].playerHost = true;

    const allPlayers = rooms[roomIndex].players.map((player)=>{
        return {
            playerName : player.playerName,
            playerHost : player.playerHost,
            playerActive : player.playerActive,
            playerCardCount : player.playerCardCount
        }
    });

    socket.to(roomCode).emit("player-left", {
        message : `${leftPlayer[0].playerName} Left The Room`,
        players : allPlayers,
        resetTimer : leftPlayer[0].playerActive && rooms[roomIndex].playersIn > 1 && rooms[roomIndex].gameOn,
        cardPlayTime : rooms[roomIndex].cardPlayTime
    });
}

const change_game_settings = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    if(roomIndex === null) return;

    rooms[roomIndex][data.changedSetting.varName] = data.changedSetting.value;

    const gameSettings = [
        {
            property : "Max Player",
            varName : "maxPlayers",
            value : rooms[roomIndex].maxPlayers
        },
        {
            property : "Cards Per Player",
            varName : "cardsPerPlayer",
            value : rooms[roomIndex].cardsPerPlayer
        },
        {
            property : "Card Decks",
            varName : "cardDecks",
            value : rooms[roomIndex].cardDecks
        },
        {
            property : "Bluff Time",
            varName : "bluffTime",
            value : rooms[roomIndex].bluffTime
        },
        {
            property : "Card Playing Time",
            varName : "cardPlayTime",
            value : rooms[roomIndex].cardPlayTime
        }
    ]

    io.to(data.roomCode).emit("update-game-settings", {
        gameSettings,
        myCards : cards.slice(0, rooms[roomIndex].cardsPerPlayer)
    });
}

const send_message = (io, socket, data)=>{
    const roomIndex = findRoom(data.roomCode);
    if(roomIndex === null) return;

    io.to(data.roomCode).emit("receive-message", {chat : data.chat});
}

// friends functions
const update_friends = (io, socket, data)=>{
    const friends = data.friends;
    const updatedFriends = friends.map((friend)=>{
        return {
            ...friend,
            online : friend.playerName in loggedUsers
        }
    });
    socket.emit("updated-friends-list", {friends : updatedFriends});
}

const change_username = (io, socket, data)=>{
    const prevName = data.prevName;
    const newName = data.newName;
    users[socket.id].playerName = newName;
    delete loggedUsers[prevName];
    loggedUsers[newName] = {
        socketID : socket.id
    };
    io.emit("change-friend-name", {prevName, newName});
}

const add_friend_invite = (io, socket, data)=>{
    try{
        const sender = users[socket.id].playerName;
        const receiver = data.receiver;

        socket.emit("add-friend-invited", {sender, receiver});
        if(receiver in loggedUsers){
            io.to(loggedUsers[receiver].socketID).emit("add-friend-invited", {sender, receiver});
        }
    }
    catch(err){
        console.log(err.message);
    }
}

const add_friend = (io, socket, data)=>{
    const myPlayerName = users[socket.id].playerName;
    const invitedPlayerName = data.invitedPlayerName;
    socket.emit("friend-added", {friend : {
        playerName : invitedPlayerName,
        online : invitedPlayerName in loggedUsers
    }});
    if(invitedPlayerName in loggedUsers){
        io.to(loggedUsers[invitedPlayerName].socketID).emit("friend-added", {friend : {
            playerName : myPlayerName,
            online : true
        }});
    }
}

const decline_friend_invite = (io, socket, data)=>{
    const myPlayerName = users[socket.id].playerName;
    const invitedPlayerName = data.invitedPlayerName;

    socket.emit("invite-declined", {
        sender : invitedPlayerName,
        receiver : myPlayerName
    });
    if(invitedPlayerName in loggedUsers){
        io.to(loggedUsers[invitedPlayerName].socketID).emit("invite-declined", {
            sender : invitedPlayerName,
            receiver : myPlayerName
        });
    }
}

const cancel_friend_invite = (io, socket, data)=>{
    try{
        const sender = users[socket.id].playerName;
        const receiver = data.receiver;

        socket.emit("invite-cancelled", {sender, receiver});
        if(receiver in loggedUsers){
            io.to(loggedUsers[receiver].socketID).emit("invite-cancelled", {sender, receiver});
        }
    }
    catch(err){
        console.log(err.message);
    }
}

const invite_to_game = (io, socket, data)=>{
    try{
        const sender = users[socket.id].playerName;
        const receiver = data.playerName;

        if(receiver in loggedUsers){
            io.to(loggedUsers[receiver].socketID).emit("game-invite", {sender, roomCode : data.roomCode});
        }
        else throw Error("Receiver Logged Out");
    }
    catch(err){
        console.log(err.message);
    }
}

module.exports = {
    create_room,
    join_room,
    start_game,
    set_claim,
    play_card_info,
    pass_chance,
    get_prev_cards,
    correct_bluff_guess,
    wrong_bluff_guess,
    leave_room,
    reset_game,
    handle_connect,
    handle_disconnect,
    handle_login,
    handle_logout,
    change_game_settings,
    send_message,
    update_friends,
    change_username,
    add_friend_invite,
    add_friend,
    decline_friend_invite,
    cancel_friend_invite,
    invite_to_game
}