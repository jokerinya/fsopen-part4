const blogRouter = require('express').Router();
const jwt = require('jsonwebtoken');

const Blog = require('../models/blog');
const User = require('../models/user');
const middlewares = require('../utils/middlewares');

blogRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', {
        username: 1,
        name: 1,
        id: 1,
    });
    response.status(200).json(blogs);
});

blogRouter.post('/', middlewares.userExtractor, async (request, response) => {
    const { author, url, likes, title } = request.body;

    if (!author || !url || !title) {
        return response.status(400).json({
            error: 'make sure all required fields are sent (title, author, url)',
        });
    }

    const user = request.user; // added by middleware
    const blog = new Blog({
        url,
        author,
        title,
        likes: likes === undefined ? 0 : likes,
        user: user._id,
    });

    const savedBlog = await blog.save();
    user.blogs = [...user.blogs, savedBlog];
    await user.save();
    response.status(201).json(savedBlog);
});

blogRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id);
    if (blog) {
        response.status(200).json(blog);
    } else {
        response.status(404).end();
    }
});

blogRouter.delete(
    '/:id',
    middlewares.userExtractor,
    async (request, response) => {
        const user = request.user;

        const blog = await Blog.findById(request.params.id);

        if (!blog) {
            return response
                .status(400)
                .json({ error: 'there is no blog with this id' });
        }

        if (blog.user.toString() !== user._id.toString()) {
            return response
                .status(401)
                .json({ error: 'only the creater of the blog can delete it' });
        }
        await blog.remove();
        response.status(204).end();
    }
);

blogRouter.put('/:id', async (request, response) => {
    const { author, url, likes, title } = request.body;

    if (!author || !url || !title || !likes) {
        return response.status(400).json({
            error: 'make sure all required fields are sent (title, author, url, likes)',
        });
    }

    const blog = { url, author, title, likes };
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
        new: true,
        runValidators: true,
        context: 'query',
    });

    if (updatedBlog) {
        response.status(201).json(updatedBlog);
    } else {
        response.status(400).json({
            error: `No person with this id: '${request.params.id}'`,
        });
    }
});
module.exports = blogRouter;
