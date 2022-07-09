const mongoose = require('mongoose');
const supertest = require('supertest');

const app = require('../app');
const Blog = require('../models/blog');
const User = require('../models/user');

const helper = require('./tests_helper');
// creates a test express app
const api = supertest(app);

beforeEach(async () => {
    await Blog.deleteMany({});
    await User.deleteMany({});
    console.log('db cleared');

    const testUserObj = {
        username: 'testuser',
        name: 'Test User',
        password: 'password',
    };

    await api.post('/api/v1/users').send(testUserObj);
    const testUser = await User.findOne({ username: testUserObj.username });
    /* This will make async call in an order and prevents error */
    const blogObjects = helper.initialBlogs.map(
        (blog) => new Blog({ ...blog, user: testUser.id })
    );
    const promiseArray = blogObjects.map((blog) => blog.save());
    const savedBlogs = await Promise.all(promiseArray);
    testUser.blogs = savedBlogs.map((blog) => blog._id);
    await testUser.save();
    console.log('fake data added 1 user, 6 blogs');
});

describe.only('when there is initially some blogs saved', () => {
    test('blog post are in the JSON format', async () => {
        await api
            .get('/api/v1/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/);
    });

    test('the correct amount of blog posts returned', async () => {
        const response = await api.get('/api/v1/blogs');

        expect(response.body).toHaveLength(helper.initialBlogs.length);
    });

    test('blog posts contains id property', async () => {
        // checks a random blog's id property
        const randomBlog = await helper.randomBlog();
        expect(randomBlog.id).toBeDefined();
    });
});

describe.only('addition of a new blog', () => {
    let token = null;
    beforeEach(async () => {
        // get jwt
        const testUserCredentials = {
            username: 'testuser',
            password: 'password',
        };
        const result = await api
            .post('/api/v1/login')
            .send(testUserCredentials);

        token = result.body.token;
    });
    test('successfully creates a new blog post', async () => {
        const newBlog = {
            url: 'https://github.com/jokerinya',
            likes: 100,
            author: 'Ibrahim Sakaci',
            title: 'Github page of me.',
        };

        const { body } = await api
            .post('/api/v1/blogs')
            .send(newBlog)
            .set('authorization', `bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/);

        const blogsAfterSaving = await helper.blogsInDb();
        expect(blogsAfterSaving).toHaveLength(helper.initialBlogs.length + 1);
        const createdBlog = { ...body };
        expect(createdBlog.title).toEqual(newBlog.title);
    });

    test('creation fails with proper statuscode if token is not provided', async () => {
        const newBlogWithoutTitle = {
            url: 'https://github.com/jokerinya',
            likes: 100,
            author: 'Ibrahim Sakaci',
        };

        await api
            .post('/api/v1/blogs')
            .send(newBlogWithoutTitle)
            // .set('authorization', `bearer ${token}`)
            .expect(401);
        expect(await helper.blogsInDb()).toHaveLength(
            helper.initialBlogs.length
        );
    });

    test('if likes property is missing, it will default to the value 0', async () => {
        const newBlogWithoutLikes = {
            url: 'https://github.com/jokerinya',
            author: 'Ibrahim Sakaci',
            title: 'Github page of me.',
        };

        const { body } = await api
            .post('/api/v1/blogs')
            .send(newBlogWithoutLikes)
            .set('authorization', `bearer ${token}`);

        const blogsAfterSaving = await helper.blogsInDb();
        expect(blogsAfterSaving).toHaveLength(helper.initialBlogs.length + 1);
        const createdBlog = { ...body };
        expect(createdBlog.likes).toBe(0);
    });

    test('title and url properties are not missing', async () => {
        // Title is missing
        const newBlogWithoutTitle = {
            url: 'https://github.com/jokerinya',
            likes: 100,
            author: 'Ibrahim Sakaci',
        };

        await api
            .post('/api/v1/blogs')
            .send(newBlogWithoutTitle)
            .set('authorization', `bearer ${token}`)
            .expect(400);
        expect(await helper.blogsInDb()).toHaveLength(
            helper.initialBlogs.length
        );
        // URL is missing
        const newBlogWithoutUrl = {
            likes: 100,
            author: 'Ibrahim Sakaci',
            title: 'Github page of me.',
        };

        await api
            .post('/api/v1/blogs')
            .send(newBlogWithoutUrl)
            .set('authorization', `bearer ${token}`)
            .expect(400);
        expect(await helper.blogsInDb()).toHaveLength(
            helper.initialBlogs.length
        );
    });
});

describe('deleting a blog', () => {
    test('a blog can be deleted', async () => {
        const aRandomBlogInDB = await helper.randomBlog();

        await api.delete(`/api/v1/blogs/${aRandomBlogInDB.id}`).expect(204);
        await api.get(`/api/v1/blogs/${aRandomBlogInDB.id}`).expect(404);
    });
});

describe('updating a blog', () => {
    test('updating likes of a blog', async () => {
        const aRandomBlogInDB = await helper.randomBlog();
        const updatedBlog = {
            ...aRandomBlogInDB,
            likes: aRandomBlogInDB.likes + 1,
        };
        const { body } = await api
            .put(`/api/v1/blogs/${updatedBlog.id}`)
            .send(updatedBlog)
            .expect(201);
        const updatedBlogInDB = { ...body };
        expect(updatedBlogInDB).toEqual(updatedBlog);
    });
});

afterAll(async () => {
    await Blog.deleteMany({});
    await User.deleteMany({});
    mongoose.connection.close();
});
