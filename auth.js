class AuthManager {
    constructor() {
        this.db = null;
        this.currentUser = null;
    }

    async init() {
        try {
            this.db = new CurrencyDatabase();
            await this.db.init();
            this.checkExistingSession();
        } catch (error) {
            console.error('Ошибка инициализации AuthManager:', error);
        }
    }

    async register(userData) {
        if (!this.db) {
            throw new Error('База данных не инициализирована');
        }

        const { email, password, username } = userData;
        
        // Проверка существующего пользователя
        const existingUser = await this.db.getUserByEmail(email);
        if (existingUser) {
            throw new Error('Пользователь с таким email уже существует');
        }

        // Хэширование пароля
        const hashedPassword = await this.hashPassword(password);
        
        const user = {
            email,
            username,
            password: hashedPassword,
            createdAt: new Date(),
            lastLogin: new Date()
        };

        await this.db.addUser(user);
        return this.login(email, password);
    }

    async login(email, password) {
        if (!this.db) {
            throw new Error('База данных не инициализирована');
        }

        const user = await this.db.getUserByEmail(email);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        const isValidPassword = await this.verifyPassword(password, user.password);
        if (!isValidPassword) {
            throw new Error('Неверный пароль');
        }

        // Обновление времени последнего входа
        user.lastLogin = new Date();
        
        this.currentUser = user;
        this.saveSession(user);
        return user;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    checkExistingSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    saveSession(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Упрощенное хэширование пароля
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async verifyPassword(password, hash) {
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword === hash;
    }
}