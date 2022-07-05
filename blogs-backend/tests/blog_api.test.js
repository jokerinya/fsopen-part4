const mongoose = require('mongoose');
const supertest = require('supertest');

const app = require('../app');
const Blog = require('../models/blog');

const helper = require('./tests_helper');
// creates a test express app
const api = supertest(app);

beforeEach(async () => {
    await Blog.deleteMany({});
    console.log('cleared');

    /* This will make async call in an order and prevents error */
    const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));
    const promiseArray = blogObjects.map((blog) => blog.save());
    await Promise.all(promiseArray);

    console.log('done');
});

describe('when there is initially some blogs saved', () => {
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

describe('addition of a new blog', () => {
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
            .expect(201)
            .expect('Content-Type', /application\/json/);

        const blogsAfterSaving = await helper.blogsInDb();
        expect(blogsAfterSaving).toHaveLength(helper.initialBlogs.length + 1);
        const createdBlog = { ...body };
        newBlog['id'] = createdBlog.id; // add id property to newBlog
        expect(createdBlog).toEqual(newBlog);
    });

    test('if likes property is missing, it will default to the value 0', async () => {
        const newBlogWithoutLikes = {
            url: 'https://github.com/jokerinya',
            author: 'Ibrahim Sakaci',
            title: 'Github page of me.',
        };

        const { body } = await api
            .post('/api/v1/blogs')
            .send(newBlogWithoutLikes);

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

        await api.post('/api/v1/blogs').send(newBlogWithoutTitle).expect(400);
        expect(await helper.blogsInDb()).toHaveLength(
            helper.initialBlogs.length
        );
        // URL is missing
        const newBlogWithoutUrl = {
            likes: 100,
            author: 'Ibrahim Sakaci',
            title: 'Github page of me.',
        };

        await api.post('/api/v1/blogs').send(newBlogWithoutUrl).expect(400);
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
    test.only('updating likes of a blog', async () => {
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

afterAll(() => {
    mongoose.connection.close();
});
