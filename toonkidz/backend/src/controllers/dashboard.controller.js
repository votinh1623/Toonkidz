import User from '../models/user.model.js';
import Story from '../models/story.model.js';
import Post from '../models/post.model.js';

const getDatesInRange = (startDate, endDate) => {
  const date = new Date(startDate.getTime());
  const dates = [];
  while (date <= endDate) {
    dates.push(new Date(date).toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

export const getDashboardStats = async (req, res) => {
  try {
    const { range = '7' } = req.query;
    const days = parseInt(range);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const [totalUsers, totalStories, totalPosts, totalLikesData] = await Promise.all([
      User.countDocuments(),
      Story.countDocuments(),
      Post.countDocuments(),
      Story.aggregate([{ $group: { _id: null, total: { $sum: "$totalLikes" } } }])
    ]);

    const dateList = getDatesInRange(startDate, endDate);

    const dateMatch = { createdAt: { $gte: startDate, $lte: endDate } };

    const userGrowth = await User.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const postGrowth = await Post.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const lineData = [];

    const userMap = new Map(userGrowth.map(i => [i._id, i.count]));
    const postMap = new Map(postGrowth.map(i => [i._id, i.count]));

    dateList.forEach(date => {
      lineData.push({
        date: date,
        value: userMap.get(date) || 0,
        type: 'Người dùng'
      });
      lineData.push({
        date: date,
        value: postMap.get(date) || 0,
        type: 'Bài đăng'
      });
    });

    const storyStatus = await Story.aggregate([
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {
      'published': 'Đã xuất bản',
      'draft': 'Bản nháp',
      'generated': 'AI đã tạo',
      'generating': 'Đang tạo'
    };

    const pieData = storyStatus
      .filter(item => item._id)
      .map(item => ({
        type: statusMap[item._id] || item._id,
        value: item.value
      }));

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email pfp createdAt');

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStories,
        totalPosts,
        totalLikes: totalLikesData[0]?.total || 0
      },
      lineData,
      pieData,
      recentUsers
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};