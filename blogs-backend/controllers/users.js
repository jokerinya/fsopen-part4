const usersRouter = require('express').Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');

usersRouter.post('/', async (request, response) => {
    const { username, password, name } = request.body;
    if (!username || !password) {
        return response.status(400).json({
            error: 'please fill required fields (username, password)',
        });
    }
    if (password.length < 3 || username.length < 3) {
        return response.status(400).json({
            error: 'name and password must be at least 3 chars',
        });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return response.status(400).json({ error: 'username must be unique' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ username, name, passwordHash });
    const savedUser = await newUser.save();
    response.status(201).json(savedUser);
});

usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs', {
        url: 1,
        title: 1,
        author: 1,
        id: 1,
    });
    response.status(200).json(users);
});

module.exports = usersRouter;
