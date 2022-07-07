// imports
const express = require('express');
const createErrors = require('http-errors');
const { Blog } = require('../models/blog.model');

// CRUD

 const createBlog = async(blogBody) => {
    try {

        const newBlog = new Blog(blogBody);
        let savedBlog = await newBlog.save();

        savedBlog = await savedBlog
        .populate('writter', 'first_name last_name joined')
        .populate('category', 'name')
        .populate('comments.people', 'first_name last_name')
        .execPopulate();

        return Promise.resolve(savedBlog);

    } catch (error) {
        return Promise.reject(error);
    }
}

const findUniqueBlog = async(searchParams, selectFields = '') => {
    try {
        
        const blogResult = await Blog
        .findOne(searchParams)
        .select(selectFields);
        if( !blogResult ) {
            throw createErrors.NotFound('Incorrect information');
        }

        return Promise.resolve(blogResult);

    } catch (error) {
        if( error.name == 'CastError' ) {
            error = createErrors.BadRequest('Invalid bloggerId')
        }
        return Promise.reject(error);
    }
}


const updateBlog = async(blogBody) => {
    try {
        
        const blogId = blogBody.blogId;
        const updateBody = utils.makeObjectExcept(blogBody, ['blogId']);
        const updatedBlog = await Blog.updateOne({ _id: blogId }, updateBody);

        return Promise.resolve(updatedBlog);

    } catch (error) {
        return Promise.reject(error);
    }
}

const readBlogs = async(
    searchParams = {}, 
    selectFields = '', 
    perPage = 99999999, 
    page = 0) => {
    try {

        const blogs = await Blog
        .find(searchParams)
        .limit(perPage)
        .skip(perPage * page)
        .populate('writter', 'first_name last_name joined')
        .populate('category', 'name')
        .populate('comments.people', 'first_name last_name img')
        .select(selectFields);
        return Promise.resolve(blogs);

    } catch (error) {
        if( error.name == 'CastError' ) {
            error = createErrors.BadRequest('Invalied blogId');
        }
        return Promise.reject(error);
    }
}

const countBlogs = async(countParams) => {
    try {

        const numBlogs = await Blog
        .where(countParams)
        .countDocuments();
        return Promise.resolve(numBlogs);

    } catch (error) {
        if( error.name == 'CastError' ) {
            error = createErrors.BadRequest('Invalied Id provided');
        }
        return Promise.reject(error);
    }
}

const reactBlog = async(blog, reactBody) => {

    try {

        const allReacts = ['like', 'love', 'funny', 'sad', 'informative'];
        let oldReactName = '';

        // remove all reacts of this user
        allReacts.forEach(react => {
            blog.reacts[react] = blog.reacts[react].filter(r => {
                if( reactBody.userId == r ) {
                    oldReactName = react;
                } else {
                    return r;
                }
            });
        });

        // set new react
        if( oldReactName != reactBody.reactName ) {
            blog.reacts[reactBody.reactName].push(reactBody.userId);
        }

        let updatedBlog = await blog.save();

        return Promise.resolve(updatedBlog);

    } catch (error) {
        return Promise.reject(error);
    }
}

const postComment = async(blog, commentBody) => {
    try {

        blog.comments.push({
            people: commentBody.userId,
            body: commentBody.body
        });

        let updatedBlog = await blog.save();
        updatedBlog = await updatedBlog
        .populate('comments.people', 'first_name last_name img')
        .execPopulate();

        return Promise.resolve(updatedBlog);

    } catch (error) {
        return Promise.reject(error);
    }
}

const deleteBlog = async(blog, blogBody) => {
    try {

        blog.blogs = blog.blogs.filter(c => {
            if( c._id == blogBody.id && c.people._id == blogBody.userId ) {
                return false;
            } else {
                return true;
            }
        });

        const updatedBlog = await blog.save();
        return Promise.resolve(updatedBlog);

    } catch (error) {
        return Promise.reject(error);
    }
}

const deleteComment = async(blog, commentBody) => {
    try {

        blog.comments = blog.comments.filter(c => {
            if( c._id == commentBody.id && c.people._id == commentBody.userId ) {
                return false;
            } else {
                return true;
            }
        });

        const updatedBlog = await blog.save();
        return Promise.resolve(updatedBlog);

    } catch (error) {
        return Promise.reject(error);
    }
}

// exports
module.exports = {
    createBlog,
    findUniqueBlog,
    updateBlog,
    readBlogs,
    countBlogs,
    reactBlog,
    postComment,
    deleteBlog,
    deleteComment
}