// auth-pages.js - общая логика для страниц авторизации и регистрации

class AuthPages {
    constructor() {
        this.authManager = new AuthManager();
        this.init();
    }

    async init() {
        await this.authManager.init();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Для страницы логина
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Для страницы регистрации
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Проверяем, если пользователь уже авторизован - перенаправляем
        if (this.authManager.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const messageElement = document.getElementById('authMessage');

        try {
            await this.authManager.login(email, password);
            this.showMessage(messageElement, 'Успешный вход! Перенаправление...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            this.showMessage(messageElement, error.message, 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageElement = document.getElementById('authMessage');

        // Проверка подтверждения пароля
        if (password !== confirmPassword) {
            this.showMessage(messageElement, 'Пароли не совпадают', 'error');
            return;
        }

        // Проверка минимальной длины пароля
        if (password.length < 6) {
            this.showMessage(messageElement, 'Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        try {
            await this.authManager.register({ username, email, password });
            this.showMessage(messageElement, 'Регистрация успешна! Перенаправление...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            this.showMessage(messageElement, error.message, 'error');
        }
    }

    showMessage(element, message, type) {
        element.textContent = message;
        element.className = `auth-message ${type}`;
        element.style.display = 'block';

        // Автоматическое скрытие сообщения через 5 секунд
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new AuthPages();
});