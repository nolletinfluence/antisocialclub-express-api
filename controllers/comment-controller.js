const { prisma } = require("../prisma/prisma-client");

const CommentController = {
    createComment: async (req, res) => {
        const { content, postId } = req.body;
        const userId = req.user.userId;

        if (!content || !postId) {
            return res.status(400).json({ error: 'Все поля должны быть заполнены' });
        }

        try {
            const comment = await prisma.comment.create({
                data: {
                    postId,
                    userId,
                    content
                }
            })

            res.status(201).json(comment);
    } catch (error) {
        console.error('Ошибка при создании комментария', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }},

    deleteComment: async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        try {
            const comment = await prisma.comment.findUnique({ where: { id } });

            if (!comment) {
                return res.status(404).json({ error: 'Комментарий не найден' });
            }

            if (comment.userId !== userId) {
                return res.status(403).json({ error: 'Нет доступа' });
            }

            const deletedComment = await prisma.comment.delete({ where: { id } });
            res.json(deletedComment);

        } catch (error) {
            console.error('Ошибка при удалении комментария', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

module.exports = CommentController;