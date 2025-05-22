const { prisma } = require("../prisma/prisma-client");

const FollowController = {
    followUser: async (req, res) => {
      const { followingId } = req.body;
      const userId = req.user.userId;

      if(followingId === userId) {
        return res.status(500).json({ error: 'Вы не можете подписаться на самого себя' });
      }

      try {
        const existingSubscription = await prisma.follows.findFirst({
            where: {
                AND: [
                    { followerId: userId },
                    { followingId }
                ]
            }
        })

        if(existingSubscription) {
            return res.status(400).json({ error: 'Вы уже подписаны' });
        };

        await prisma.follows.create({
            data: {
                follower: { connect: { id: userId } },
                following: { connect: { id: followingId } }
            }
        })

        res.status(200).json({message: 'Вы успешно подписались'});

      } catch (error) {
        console.error('Ошибка при подписке', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    },
    unfollowUser: async (req, res) => {
      const { followingId } = req.body;
      const userId = req.user.userId;

      try {
        const follows = await prisma.follows.findFirst({
            where: {
                AND: [
                    { followerId: userId },
                    { followingId }
                ]
            }
        })

        if(!follows) {
            return res.status(400).json({ error: 'Вы не подписаны на этого пользователя' });
        };

        await prisma.follows.delete({
            where: {
                id: follows.id
            }
        })

        res.status(200).json({message: 'Вы отписались'});
      } catch (error) {
        console.error('Ошибка при отписке', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
};

module.exports = FollowController;