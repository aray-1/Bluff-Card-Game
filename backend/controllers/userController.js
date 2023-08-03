require("dotenv").config();
const User = require("../models/user");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const invalidCharacters = new Set(['<','>','.','/',',','?',':',';','\'','\"','{','[','}',']','|','\\','`','~','!','@','#','$','%','^','&','*','(',')','-','_','=','+']);

function hashPassword(password){
    const hmac = crypto.createHmac("sha256", process.env.HASH_SECRET);
    return hmac.update(password).digest("hex");
}

function filterString(s, n){
    // s -> input string
    // n -> length of input string
    let filtered = "";
    for(let i=0;i<n;i++){
        if(invalidCharacters.has(s[i])) continue;
        filtered += s[i];
    }

    return filtered;
}

const sign_in  = async (req, res)=>{
    try{
        if(!("userName" in req.body)) throw Error("userName not found in request body");
        if(!("password" in req.body)) throw Error("password not found in request body");
        
        const userName = req.body.userName;
        const password = req.body.password;
        const hashedPassword = hashPassword(password);

        const user = await User.findOne({UserName : userName, UserPassword : hashedPassword});
        if(!user) throw Error("Invalid Username/Password");

        const accessToken = jwt.sign({userName}, process.env.TOKEN_SECRET, {expiresIn : 21600});

        res.status(200).json({accessToken});

    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const sign_up = async (req, res)=>{
    try{
        if(!("userName" in req.body)) throw Error("userName not found in request body");
        if(!("password" in req.body)) throw Error("password not found in request body");

        const userName = filterString(req.body.userName, req.body.userName.length);
        const password = req.body.password;

        if(userName.length > 20) throw Error("Name should be less than 20 characters");
        if(password.length < 8) throw Error("Password should be atleast 8 characters");

        const existingUser = await User.findOne({UserName : userName});
        if(existingUser) throw Error("Username Already Taken");

        const hashedPassword = hashPassword(password);
        const newUser = new User({
            UserName : userName,
            UserPassword : hashedPassword
        });

        newUser.save()
        .then((result)=>{
            res.status(200).json({message : "Account Created"});
        })
        .catch((err)=>{
            throw Error(err.message);
        })
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const change_name = async (req, res)=>{
    try{
        if(!("userName" in req.body)) throw Error("userName not found in request body");
        const prevUserName = req.userName;
        const newUserName = filterString(req.body.userName, req.body.userName.length);

        if(newUserName.length === 0) throw Error("Cannot Change Name");
        else if (newUserName.length > 20) throw Error("Name should be less than 20 characters");

        const existingUser = await User.findOne({UserName : newUserName}).select("UserName");

        if(existingUser) throw Error("Name Already Taken");
        
        // update my document for username
        await User.updateOne({UserName : prevUserName}, {UserName : newUserName});

        // update documents to which invites have been sent
        const myUser = await User.findOne({UserName : newUserName}).select("FriendInvitesSent FriendInvitesReceived");
        const invitesSent = myUser.FriendInvitesSent.map(invite=>invite.PlayerName);
        const invitesReceived = myUser.FriendInvitesReceived.map(invite=>invite.PlayerName);

        // update the received section of users
        await User.updateMany(
            {
                UserName : {$in : invitesSent},
                FriendInvitesReceived : {$elemMatch : {PlayerName : prevUserName}}
            },
            {
                $set : {"FriendInvitesReceived.$[elem].PlayerName" : newUserName}
            },
            {
                arrayFilters : [{"elem.PlayerName" : prevUserName}]
            }
        )

        // update the sent section of users
        await User.updateMany(
            {
                UserName : {$in : invitesReceived},
                FriendInvitesSent : {$elemMatch : {PlayerName : prevUserName}}
            },
            {
                $set : {"FriendInvitesSent.$[elem].PlayerName" : newUserName}
            },
            {
                arrayFilters : [{"elem.PlayerName" : prevUserName}]
            }
        );

        const accessToken = jwt.sign({userName : newUserName}, process.env.TOKEN_SECRET, {expiresIn : 21600});

        res.status(200).json({accessToken});
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const invite_player = async (req, res)=>{
    try{
        if(!("invitedPlayerName" in req.body)) throw Error("invitedPlayerName not found in request body");
        
        const myPlayerName = req.userName;
        const invitedPlayerName = req.body.invitedPlayerName;
        const existingUser = await User.findOne({UserName : invitedPlayerName});

        if(myPlayerName === invitedPlayerName) throw Error("Cannot Invite Yourself");
        // check if player exists
        if(!existingUser) throw Error("Player Does Not Exist");

        // check if player already invited
        const invites = await User.findOne(
            {UserName : invitedPlayerName, FriendInvitesReceived : {$elemMatch : {PlayerName : myPlayerName}}},
            {"FriendInvitesReceived.$" : 1}
        );
        if(invites && invites.FriendInvitesReceived.length > 0){
            throw Error("Player Already Invited");   
        }

        // check if player already in friends
        const friends = await User.findOne(
            {UserName : myPlayerName, Friends : {$elemMatch : {PlayerName : invitedPlayerName}}},
            {"Friends.$" : 1}
        )
        if(friends && friends.Friends.length > 0){
            throw Error("Player Is Already A Friend");
        }

        // update invited players document
        await User.updateOne({UserName : invitedPlayerName}, {$push : {FriendInvitesReceived : {PlayerName : myPlayerName}}});
        // update sender's document
        await User.updateOne({UserName : myPlayerName}, {$push : {FriendInvitesSent : {PlayerName : invitedPlayerName}}});

        res.status(200).json({message : "Invite Sent"});
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const accept_invite = async (req, res)=>{
    try{
        if(!("invitedPlayerName" in req.body)) throw Error("invitedPlayerName not found in request body");

        const myPlayerName = req.userName;
        const invitedPlayerName = req.body.invitedPlayerName; // invited by
        const existingUser = await User.findOne({UserName : invitedPlayerName}).select("UserName");

        // check if player exists
        if(!existingUser) throw Error("Player Does Not Exist");

        const invitedUser = await User.aggregate([
            {$match : {UserName : invitedPlayerName}},
            {$unwind : "$Friends"},
            {$match : {"Friends.PlayerName" : myPlayerName}},
            {$group : {_id : "$_id", Friends : {$push : "$Friends"}}}
        ]);
        if(invitedUser[0]?.Friends.length === 0 || !invitedUser[0]){
            await User.updateOne(
                {UserName : invitedPlayerName},
                {
                    $push : {Friends : {PlayerName : myPlayerName}},
                    $pull : {
                        FriendInvitesReceived : {PlayerName : myPlayerName},
                        FriendInvitesSent : {PlayerName : myPlayerName}
                    }
                }
            )
        }
        else{
            await User.updateOne({UserName : invitedPlayerName},{
                $pull : {
                    FriendInvitesReceived : {PlayerName : myPlayerName},
                    FriendInvitesSent : {PlayerName : myPlayerName}
                }
            });
        }

        const myUser = await User.aggregate([
            {$match : {UserName : myPlayerName}},
            {$unwind : "$Friends"},
            {$match : {"Friends.PlayerName" : invitedPlayerName}},
            {$group : {_id : "$_id", Friends : {$push : "$Friends"}}}
        ]);

        if(myUser[0]?.Friends.length === 0 || !myUser[0]){
            await User.updateOne(
                {UserName : myPlayerName},
                {
                    $push : {Friends : {PlayerName : invitedPlayerName}},
                    $pull : {
                        FriendInvitesReceived : {PlayerName : invitedPlayerName},
                        FriendInvitesSent : {PlayerName : invitedPlayerName}
                    }
                }
            )
        }
        else{
            await User.updateOne({UserName : myPlayerName}, {
                $pull : {
                    FriendInvitesReceived : {PlayerName : invitedPlayerName},
                    FriendInvitesSent : {PlayerName : invitedPlayerName}
                }
            });
        }

        res.status(200).json({message : "Player Added To Friends"});
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const decline_invite = async (req, res)=>{
    try{
        if(!("invitedPlayerName" in req.body)) throw Error("invitedPlayerName not found in request body");

        const myPlayerName = req.userName;
        const invitedPlayerName = req.body.invitedPlayerName;

        // update my document
        await User.updateOne({UserName : myPlayerName}, {
            $pull : {
                FriendInvitesReceived : {PlayerName : invitedPlayerName}
            }
        });

        // update sender's document
        await User.updateOne({UserName : invitedPlayerName}, {
            $pull : {FriendInvitesSent : {PlayerName : myPlayerName}}
        });
        res.status(200).json({message : "Player Invite Declined"});
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const cancel_invite = async (req, res)=>{
    try{
        if(!("invitedPlayerName" in req.body)) throw Error("invitedPlayerName not found in request body");

        const myPlayerName = req.userName;
        const invitedPlayerName = req.body.invitedPlayerName;

        // updating sender's document
        await User.updateOne({UserName : myPlayerName}, {$pull : {FriendInvitesSent : {PlayerName : invitedPlayerName}}});

        // updating receiver's document
        await User.updateOne({UserName : invitedPlayerName}, {$pull : {FriendInvitesReceived : {PlayerName : myPlayerName}}});

        res.status(200).json({message : "Invite Cancelled"});;
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const fetch_received_invites = async (req, res)=>{
    try{
        const myPlayerName = req.userName;
        const myUser = await User.findOne({UserName : myPlayerName}).select("FriendInvitesReceived");
        const receivedInvites = myUser.FriendInvitesReceived.map(invite=>{
            return {playerName : invite.PlayerName};
        })
        res.status(200).json({receivedInvites});
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const fetch_sent_invites = async (req, res)=>{
    try{
        const myPlayerName = req.userName;
        const myUser = await User.findOne({UserName : myPlayerName}).select("FriendInvitesSent");
        const sentInvites = myUser.FriendInvitesSent.map(invite=>{
            return {playerName : invite.PlayerName};
        })
        res.status(200).json({sentInvites});
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const fetch_friends = async (req, res)=>{
    try{
        const myPlayerName = req.userName;
        const myUser = await User.findOne({UserName : myPlayerName}).select("Friends");
        const friends = myUser.Friends.map((friend)=>{
            return {playerName : friend.PlayerName};
        })
        res.status(200).json({friends});
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

const search_player = async (req, res)=>{
    try{
        if(!("searchText" in req.body)) throw Error("searchText not found in request body");
        const searchText = filterString(req.body.searchText, req.body.searchText.length);

        if(searchText.length === 0){
            res.status(200).json({users : []});
            return;
        }

        const searchUsers = await User.find({UserName : {$regex : `^${searchText}`, $options : "i"}}).select("UserName").limit(25);

        const users = searchUsers.map((user)=>{
            return {playerName : user.UserName};
        });
        res.status(200).json({users});
    }
    catch(err){
        console.log(err.message);
        res.status(501).json({errorMessage : err.message});
    }
}

module.exports = {
    sign_in,
    sign_up,
    change_name,
    invite_player,
    accept_invite,
    decline_invite,
    cancel_invite,
    fetch_received_invites,
    fetch_sent_invites,
    fetch_friends,
    search_player
}