const { prisma } = require("../prisma/prisma-client");
const bcrypt = require('bcryptjs');
const Jdenticon = require('jdenticon');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const UserController = {
    register: async (req, res) => {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Все поля должны быть заполнены' })
        }

        try {
            const existingUser = await prisma.user.findUnique({where: {email}})

            if (existingUser) {
                return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const png = Jdenticon.toPng(`${name}${Date.now()}`, 200);
            const avatarName = `${name}_${Date.now()}.png`;
            const avatarPath = path.join(__dirname, '/../uploads', avatarName);

            fs.writeFileSync(avatarPath, png);

            const user = await prisma.user.create({ data: { email, password: hashedPassword, name, avatarUrl: `/uploads/${avatarName}` } });
            res.status(201).json(user);
        } catch (error) {
            console.error('Ошибка при регистрации', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Все поля должны быть заполнены' })
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                return res.status(400).json({ error: 'Неверный логин или пароль' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(400).json({ error: 'Неправильный логин или пароль' });
            }

            const token = jwt.sign(({ userId: user.id }), process.env.SECRET_KEY);

            res.json({ token });
        } catch (error) {
            console.error('Ошибка при авторизации', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    getUserById: async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        try {
            const user = await prisma.user.findUnique({
                where: { id }, 
                include: {
                    followers: true,
                    following: true
                } 
            })

            if (!user) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }

            const isFollowing = await prisma.follows.findFirst({
                where: {
                    AND: [
                        {followerId: userId},
                        {followingId: id}
                    ]
                }
            })

            res.json({ ...user, isFollowing: Boolean(isFollowing )});
        } catch (error) {
            console.error('Ошибка при получении пользователя', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    updateUser: async (req, res) => {
        const { id } = req.params;
        const { email, name, dateOfBirth, bio, location } = req.body;

        let filePath;

        if (req.file && req.file.path) {
            filePath = req.file.path;
        }

        if (id !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        try {
            if (email) {
                const existingUser = await prisma.user.findFirst({ where: { email: email } });

                if (existingUser && existingUser.id !== parseInt(id)) {
                    return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
                }
            }

            const user = await prisma.user.update({
                where: { id },
                data: {
                    email: email || undefined,
                    name: name || undefined,
                    avatarUrl: filePath ? `/${filePath}` : undefined,
                    dateOfBirth: dateOfBirth || undefined,
                    bio: bio || undefined,
                    location: location || undefined
                }
            });

            res.json(user);
        } catch (error) {
            console.error('Ошибка при обновлении пользователя', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    current: async (req, res) => {
        try {
            const user = await prisma.user.findUnique({ 
                where: { 
                    id: req.user.userId 
                }, 
                include: {
                    followers: {
                        include: {
                            follower: true
                        }
                    },
                    following: {
                        include: {
                            following: true
                        }
                    }
                }
             })

             if (!user) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            res.json(user);
        } catch (error) {
            console.error('Ошибка при получении текущего пользователя', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = UserController;