const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {randomBytes} = require('crypto');
const axios = require('axios');
require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 5001

app.use(cors());
app.use(bodyParser.json())

const commentsByPostId = {}

app.get('/posts/:id/comments', async (req, res) => {
    await res.send(commentsByPostId[req.params.id] || [])
})
app.post('/posts/:id/comments', async (req, res) => {
    const commentId = randomBytes(4).toString('hex');
    const {content} = req.body;
    comments = commentsByPostId[req.params.id] || [];

    comments.push({id: commentId, content, status: 'pending'});

    commentsByPostId[req.params.id] = comments;

    await axios.post('http://event-bus-srv:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    })
    res.status(201).send(comments)
});

app.post('/events', async (req, res) => {

    const { type, data } = req.body;

    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;
        const comments = commentsByPostId[postId];

        const comment = comments.find(comment => {
            return comment.id = id;
        });

        comment.status = status;

        await axios.post('http://event-bus-srv:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                postId,
                content,
                status
            }
        })
    }

    res.send({})
})

app.listen(PORT, () => {
    console.log(`this comments app is running on port ${PORT}`)
})
