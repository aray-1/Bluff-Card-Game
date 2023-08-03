const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authentication");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const userController = require("../controllers/userController");

router.post("/sign-in", jsonParser, userController.sign_in);

router.post("/sign-up", jsonParser, userController.sign_up);

router.post("/change-name", authenticateToken, jsonParser, userController.change_name);

router.post("/invite-player", authenticateToken, jsonParser, userController.invite_player);

router.post("/accept-invite", authenticateToken, jsonParser, userController.accept_invite);

router.post("/decline-invite", authenticateToken, jsonParser, userController.decline_invite);

router.post("/cancel-invite", authenticateToken, jsonParser, userController.cancel_invite);

router.get("/received-invites", authenticateToken, jsonParser, userController.fetch_received_invites);

router.get("/sent-invites", authenticateToken, jsonParser, userController.fetch_sent_invites);

router.get("/friends", authenticateToken, jsonParser, userController.fetch_friends);

router.post("/search-player", authenticateToken, jsonParser, userController.search_player);

module.exports = router;