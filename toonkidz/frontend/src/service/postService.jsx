// src/service/postService.js
import { get, post, put, del } from "@/utils/request";

export const getPosts = async (page = 1, limit = 10) => {
  try {
    const res = await get(`posts?page=${page}&limit=${limit}`);
    return res;
  } catch (err) {
    console.error("Error fetching posts:", err);
    throw err;
  }
};

export const likePost = async (postId) => {
  try {
    const res = await post(`posts/${postId}/like`);
    return res;
  } catch (err) {
    console.error("Error liking post:", err);
    throw err;
  }
};

export const addComment = async (postId, { text, rating }) => {
  try {
    const res = await post(`posts/${postId}/comment`, { text, rating });
    return res;
  } catch (err) {
    console.error("Error adding comment:", err);
    throw err;
  }
};

export const editComment = async (postId, commentId, { text, rating }) => {
  try {
    const res = await put(`posts/${postId}/comments/${commentId}`, { text, rating });
    return res;
  } catch (err) {
    console.error("Error editing comment:", err);
    throw err;
  }
};

export const deleteComment = async (postId, commentId) => {
  try {
    const res = await del(`posts/${postId}/comments/${commentId}`);
    return res;
  } catch (err) {
    console.error("Error deleting comment:", err);
    throw err;
  }
};

export const createPost = async (data) => {
  try {
    const res = await post('posts', data);
    return res;
  } catch (err) {
    console.error("Error creating post:", err);
    throw err;
  }
};

export const getPostsByUserId = async (userId) => {
  try {
    const res = await get(`posts/user/${userId}`);
    return res;
  } catch (err) {
    console.error("Error fetching user's posts:", err);
    throw err;
  }
};