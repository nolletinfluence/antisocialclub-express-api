const { prisma } = require("../prisma/prisma-client");

const LikeController = {
    likePost: async (req, res) => {
        const { postId } = req.body;
        const userId = req.user.userId;
        
        if(!postId) {
            return res.status(400).json({ error: 'Все поля должны быть заполнены' });
        }

        try {
            const existingLike = await prisma.like.findFirst({ where: { postId, userId } });
            if(existingLike) {
                return res.status(400).json({ error: 'Вы уже лайкнули этот пост' });
            }
            const like = await prisma.like.create({ data: { postId, userId } });
            res.status(201).json(like);
        } catch (error) {
            console.error('Ошибка при лайке поста', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    unlikePost: async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!id) {
            return res.status(400).json({ error: 'Вы уже поставили дизлайк' });
        }

        try {
            const existingLike = await prisma.like.findFirst({ where: { postId: id, userId } });

            if (!existingLike) {
                return res.status(400).json({ error: 'Нельзя поставить дизлайк' });
            }

            const like = await prisma.like.deleteMany({ where: { postId: id, userId } });
            res.json(like);

        } catch (error) {
            console.error('Ошибка при дизлайке поста', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
}

module.exports = LikeController;