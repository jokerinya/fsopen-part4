const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../app');
const User = require('../models/user');

const helper = require('./tests_helper');
// creates a test express app
const api = supertest(app);

describe('there is one user in the db', () => {
    beforeEach(async () => {
        await User.deleteMany({});
        const superUser = new User({
            name: 'Superuser',
            username: 'root',
            passwordHash: await bcrypt.hash('secret', 10),
        });
        await superUser.save();
    });
    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb();
        const newUser = {
            name: 'Ibrahim Sakaci',
            username: 'jokerinya',
            password: 'secret',
        };
        await api.post('/api/v1/users').send(newUser).expect(201);
        const usersAtEnd = await helper.usersInDb();
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
    });
    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb();
        const newUser = {
            name: 'Ibrahim Sakaci',
            username: 'root',
            password: 'secret',
        };
        const result = await api
            .post('/api/v1/users')
            .send(newUser)
            .expect(400);
        expect(result.body.error).toContain('username must be unique');
        const usersAtEnd = await helper.usersInDb();
        expect(usersAtEnd).toHaveLength(usersAtStart.length);
    });
    test('creation fails with proper statuscode and message if username or password is absent', async () => {
        const usersAtStart = await helper.usersInDb();
        const newUserWithoutUsername = {
            name: 'Ibrahim Sakaci',
            password: 'secret',
        };
        let result = await api
            .post('/api/v1/users')
            .send(newUserWithoutUsername)
            .expect(400);
        expect(result.body.error).toContain(
            'please fill required fields (username, password)'
        );
        const newUserWithoutPassword = {
            name: 'Ibrahim Sakaci',
            username: 'root',
        };
        result = await api
            .post('/api/v1/users')
            .send(newUserWithoutPassword)
            .expect(400);
        expect(result.body.error).toContain(
            'please fill required fields (username, password)'
        );
        const usersAtEnd = await helper.usersInDb();
        expect(usersAtEnd).toHaveLength(usersAtStart.length);
    });
    test('creation fails with proper statuscode and message if username or password is shorter than 3 characters', async () => {
        const usersAtStart = await helper.usersInDb();
        const newUserPasswordIsShort = {
            name: 'Ibrahim Sakaci',
            username: 'jo',
            password: 'secret',
        };
        let result = await api
            .post('/api/v1/users')
            .send(newUserPasswordIsShort)
            .expect(400);
        expect(result.body.error).toContain(
            'name and password must be at least 3 chars'
        );
        const newUserWithoutPassword = {
            name: 'Ibrahim Sakaci',
            username: 'jokerinya',
            password: 'se',
        };
        result = await api
            .post('/api/v1/users')
            .send(newUserWithoutPassword)
            .expect(400);
        expect(result.body.error).toContain(
            'name and password must be at least 3 chars'
        );
        const usersAtEnd = await helper.usersInDb();
        expect(usersAtEnd).toHaveLength(usersAtStart.length);
    });
});

afterAll(async () => {
    await User.deleteMany({});
    mongoose.connection.close();
});
