class CurrencyDatabase {
    constructor() {
        this.dbName = 'CurrencyAppDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Таблица пользователей
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', 
                        { keyPath: 'id', autoIncrement: true });
                    usersStore.createIndex('email', 'email', { unique: true });
                    usersStore.createIndex('username', 'username', { unique: true });
                }

                // Таблица избранных валютных пар
                if (!db.objectStoreNames.contains('favorites')) {
                    const favoritesStore = db.createObjectStore('favorites', 
                        { keyPath: 'id', autoIncrement: true });
                    favoritesStore.createIndex('userId', 'userId', { unique: false });
                    favoritesStore.createIndex('pair', 'pair', { unique: false });
                }

                // Таблица истории конвертаций
                if (!db.objectStoreNames.contains('conversions')) {
                    const conversionsStore = db.createObjectStore('conversions', 
                        { keyPath: 'id', autoIncrement: true });
                    conversionsStore.createIndex('userId', 'userId', { unique: false });
                    conversionsStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    // Методы для работы с пользователями
    async addUser(user) {
        const transaction = this.db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        return store.add(user);
    }

    async getUserByEmail(email) {
        const transaction = this.db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const index = store.index('email');
        return new Promise((resolve, reject) => {
            const request = index.get(email);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Методы для избранных валют
    async addFavorite(userId, baseCurrency, targetCurrency) {
        const transaction = this.db.transaction(['favorites'], 'readwrite');
        const store = transaction.objectStore('favorites');
        return store.add({
            userId,
            pair: `${baseCurrency}_${targetCurrency}`,
            baseCurrency,
            targetCurrency,
            createdAt: new Date()
        });
    }

    async getFavorites(userId) {
        const transaction = this.db.transaction(['favorites'], 'readonly');
        const store = transaction.objectStore('favorites');
        const index = store.index('userId');
        return new Promise((resolve, reject) => {
            const request = index.getAll(userId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeFavorite(id) {
        const transaction = this.db.transaction(['favorites'], 'readwrite');
        const store = transaction.objectStore('favorites');
        return store.delete(id);
    }

    // Методы для истории конвертаций
    async addConversion(userId, fromCurrency, toCurrency, amount, result) {
        const transaction = this.db.transaction(['conversions'], 'readwrite');
        const store = transaction.objectStore('conversions');
        return store.add({
            userId,
            fromCurrency,
            toCurrency,
            amount,
            result,
            date: new Date()
        });
    }

    async getConversionHistory(userId, limit = 10) {
        const transaction = this.db.transaction(['conversions'], 'readonly');
        const store = transaction.objectStore('conversions');
        const index = store.index('userId');
        return new Promise((resolve, reject) => {
            const request = index.getAll(userId);
            request.onsuccess = () => {
                const history = request.result
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, limit);
                resolve(history);
            };
            request.onerror = () => reject(request.error);
        });
    }
}