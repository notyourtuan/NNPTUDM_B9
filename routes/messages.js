var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');

const { checkLogin } = require('../utils/authHandler');
let messageModel = require('../schemas/messages');
let userModel = require('../schemas/users');

router.use(checkLogin);

async function findConversationPartner(userID, currentUserID) {
    return await userModel.findOne({
        _id: userID,
        isDeleted: false
    });
}

router.get('/:userID', async function (req, res, next) {
    try {
        let { userID } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userID)) {
            return res.status(400).send({ message: 'userID khong hop le' });
        }

        let partner = await findConversationPartner(userID, req.user._id);
        if (!partner) {
            return res.status(404).send({ message: 'userID khong ton tai' });
        }

        let messages = await messageModel.find({
            $or: [
                { from: req.user._id, to: userID },
                { from: userID, to: req.user._id }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('from to');

        res.send(messages);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/:userID', async function (req, res, next) {
    try {
        let { userID } = req.params;
        let { messageContent } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userID)) {
            return res.status(400).send({ message: 'userID khong hop le' });
        }

        let partner = await findConversationPartner(userID, req.user._id);
        if (!partner) {
            return res.status(404).send({ message: 'userID khong ton tai' });
        }

        if (!messageContent || !messageContent.type || !messageContent.text) {
            return res.status(400).send({ message: 'messageContent khong hop le' });
        }

        if (!['file', 'text'].includes(messageContent.type)) {
            return res.status(400).send({ message: 'type chi duoc la file hoac text' });
        }

        let newMessage = await messageModel.create({
            from: req.user._id,
            to: userID,
            messageContent: {
                type: messageContent.type,
                text: String(messageContent.text).trim()
            }
        });

        let populatedMessage = await newMessage.populate('from to');
        res.status(201).send(populatedMessage);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.get('/', async function (req, res, next) {
    try {
        let messages = await messageModel.find({
            $or: [
                { from: req.user._id },
                { to: req.user._id }
            ]
        })
            .sort({ createdAt: -1 })
            .populate('from to');

        let latestMessagesByUser = new Map();

        for (let message of messages) {
            let fromID = message.from._id.toString();
            let toID = message.to._id.toString();
            let partner = fromID === req.user._id.toString() ? message.to : message.from;
            let partnerID = partner._id.toString();

            if (!latestMessagesByUser.has(partnerID)) {
                latestMessagesByUser.set(partnerID, {
                    user: partner,
                    message: message
                });
            }
        }

        res.send(Array.from(latestMessagesByUser.values()));
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

module.exports = router;