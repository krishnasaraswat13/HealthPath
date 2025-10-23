/**
 * Notification Controller
 * In-app notification system for all user roles
 */

const Notification = require('../models/Notification');

/**
 * Get notifications for the logged-in user
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, unreadOnly } = req.query;

        const filter = { recipientId: userId };
        if (unreadOnly === 'true') filter.isRead = false;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Notification.countDocuments(filter),
            Notification.countDocuments({ recipientId: userId, isRead: false })
        ]);

        res.json({
            success: true,
            notifications,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
};

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ recipientId: req.user.id, isRead: false });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get unread count', error: error.message });
    }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.user.id },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
    }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientId: req.user.id, isRead: false },
            { isRead: true, readAt: new Date() }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark all as read', error: error.message });
    }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipientId: req.user.id });
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
    }
};

/**
 * Clear all notifications
 * DELETE /api/notifications/clear-all
 */
const clearAll = async (req, res) => {
    try {
        await Notification.deleteMany({ recipientId: req.user.id });
        res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to clear notifications', error: error.message });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
};
