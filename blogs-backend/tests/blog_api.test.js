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
    const response = await api.get('/api/v1/blogs');
    const blogs = response.body;
    // checks a random blog's id property
    const randomBlog = blogs[Math.floor(Math.random() * blogs.length)];
    expect(randomBlog.id).toBeDefined();
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

    const { body } = await api.post('/api/v1/blogs').send(newBlogWithoutLikes);

    const blogsAfterSaving = await helper.blogsInDb();
    expect(blogsAfterSaving).toHaveLength(helper.initialBlogs.length + 1);
    const createdBlog = { ...body };

    expect(createdBlog.likes).toBe(0);
});

test.only('title and url properties are not missing', async () => {
    // Title is missing
    const newBlogWithoutTitle = {
        url: 'https://github.com/jokerinya',
        likes: 100,
        author: 'Ibrahim Sakaci',
    };

    await api.post('/api/v1/blogs').send(newBlogWithoutTitle).expect(400);
    expect(await helper.blogsInDb()).toHaveLength(helper.initialBlogs.length);
    // URL is missing
    const newBlogWithoutUrl = {
        likes: 100,
        author: 'Ibrahim Sakaci',
        title: 'Github page of me.',
    };

    await api.post('/api/v1/blogs').send(newBlogWithoutUrl).expect(400);
    expect(await helper.blogsInDb()).toHaveLength(helper.initialBlogs.length);
});

afterAll(() => {
    mongoose.connection.close();
});
