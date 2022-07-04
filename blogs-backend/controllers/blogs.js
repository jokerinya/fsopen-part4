const blogRouter = require('express').Router();
const Blog = require('../models/blog');

blogRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({});
    response.status(200).json(blogs);
});

blogRouter.post('/', async (request, response) => {
    const { author, url, likes, title } = new Blog(request.body);

    if (!author || !url || !title) {
        return response.status(400).json({
            error:
                'make sure all required fields are sended (title, author, url)',
        });
    }

    const blog = new Blog({
        url,
        author,
        title,
        likes: likes === undefined ? 0 : likes,
    });

    const savedBlog = await blog.save();
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

module.exports = blogRouter;
