const _ = require('lodash');

const dummy = (blogs) => {
    return 1;
};

const totalLikes = (blogs) => {
    if (blogs.length === 0) return 0;
    const reducer = (sum, blog) => sum + blog.likes;

    return blogs.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
    if (blogs.length === 0) return {};

    const firstBlogWithMaxLikes = blogs.reduce((favBlog, currentBlog) =>
        favBlog.likes > currentBlog.likes ? favBlog : currentBlog
    );
    return {
        title: firstBlogWithMaxLikes.title,
        author: firstBlogWithMaxLikes.author,
        likes: firstBlogWithMaxLikes.likes,
    };
};

const mostBlogs = (blogs) => {
    /* Without Lodash */
    // { 'Michael Chan': 1, 'Edsger W. Dijkstra': 2, 'Robert C. Martin': 3 }
    // const authorDict = {};
    // blogs.forEach((blog) => {
    //     if (authorDict[blog.author]) {
    //         authorDict[blog.author] += 1;
    //     } else {
    //         authorDict[blog.author] = 1;
    //     }
    // });
    // const maxBlogedAuthor = {};
    // Object.keys(authorDict).forEach((key) => {
    //     if (!maxBlogedAuthor.author) {
    //         maxBlogedAuthor.author = key;
    //         maxBlogedAuthor.blogs = authorDict[key];
    //     }
    //     if (authorDict[key] > maxBlogedAuthor.blogs) {
    //         maxBlogedAuthor.author = key;
    //         maxBlogedAuthor.blogs = authorDict[key];
    //     }
    // });

    /* With Lodash */
    const maxBlogedAuthor = _.chain(blogs)
        .groupBy('author')
        .map((group, author) => {
            return {
                author: author,
                blogs: group.length,
            };
        })
        .maxBy('blogs')
        .value();
    return { ...maxBlogedAuthor };
};

const mostLikes = (blogs) => {
    /* Without Lodash */
    // { 'Michael Chan': 1, 'Edsger W. Dijkstra': 2, 'Robert C. Martin': 3 }
    // const authorDict = {};
    // make a object with key as author and total likes as value
    // blogs.forEach((blog) => {
    //     if (authorDict[blog.author]) {
    //         authorDict[blog.author] += blog.likes;
    //     } else {
    //         authorDict[blog.author] = blog.likes;
    //     }
    // });
    // const mostLikedAuthor = {};
    // find author who is max likes
    // Object.keys(authorDict).forEach((key) => {
    //     if (!mostLikedAuthor.author) {
    //         mostLikedAuthor.author = key;
    //         mostLikedAuthor.likes = authorDict[key];
    //     }
    //     if (authorDict[key] > mostLikedAuthor.likes) {
    //         mostLikedAuthor.author = key;
    //         mostLikedAuthor.likes = authorDict[key];
    //     }
    // });

    /* With Lodash */
    const mostLikedAuthor = _.chain(blogs)
        .groupBy('author')
        .map((group, author) => {
            return {
                author: author,
                likes: group.reduce((sum, blog) => sum + blog.likes, 0),
            };
        })
        .maxBy('likes')
        .value();

    return { ...mostLikedAuthor };
};

module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes };
