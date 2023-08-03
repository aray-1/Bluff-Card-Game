const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const friendSchema = new Schema({
    PlayerName : {
        type : String
    }
});

const userSchema = new Schema({
    UserName : {
        type : String,
        required : true
    },
    UserPassword : {
        type : String,
        required : true
    },
    FriendInvitesReceived : [friendSchema],
    FriendInvitesSent : [friendSchema],
    Friends : [friendSchema]
});

const User = mongoose.model("User", userSchema);

module.exports = User;