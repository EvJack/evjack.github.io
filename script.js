class CurrencyAnalyzer {
    constructor() {
        this.baseCurrency = document.getElementById('baseCurrency');
        this.targetCurrency = document.getElementById('targetCurrency');
        this.amount = document.getElementById('amount');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.rateInfo = document.getElementById('rateInfo');
        this.statsInfo = document.getElementById('statsInfo');
        this.loading = document.getElementById('loading');
        this.apiStatus = document.getElementById('apiStatus');
        this.chart = null;
        
        this.periodButtons = document.querySelectorAll('.period-btn');
        this.currentPeriod = 7;

        // Система аутентификации
        this.authManager = null;
        this.db = null;
        this.isDbInitialized = false;
        
        // Элементы для авторизации
        this.authContainer = document.getElementById('authContainer');
        this.userInfoContainer = document.getElementById('userInfoContainer');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.profileBtn = document.getElementById('profileBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.usernameSpan = document.getElementById('usernameSpan');

        this.cache = {
            current: {},
            historical: {}
        };

        this.initializeEventListeners();
        this.populateCurrencyList();
        this.testAPI();
        this.initAuth();
    }

    async initAuth() {
        try {
            this.db = new CurrencyDatabase();
            await this.db.init();
            this.isDbInitialized = true;
            
            this.authManager = new AuthManager();
            await this.authManager.init();
            this.updateAuthUI();
        } catch (error) {
            console.error('Ошибка инициализации аутентификации:', error);
            this.isDbInitialized = false;
        }
    }

    updateAuthUI() {
        if (!this.authManager) return;
        
        if (this.authManager.isAuthenticated()) {
            // Показываем информацию о пользователе
            this.authContainer.style.display = 'none';
            this.userInfoContainer.style.display = 'block';
            this.usernameSpan.textContent = this.authManager.currentUser.username;
        } else {
            // Показываем кнопки авторизации
            this.authContainer.style.display = 'block';
            this.userInfoContainer.style.display = 'none';
        }
    }

    initializeEventListeners() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeCurrency());
        
        this.baseCurrency.addEventListener('change', () => this.analyzeCurrency());
        this.targetCurrency.addEventListener('change', () => this.analyzeCurrency());
        this.amount.addEventListener('input', () => this.updateConversion());

        // Обработчики периодов
        this.periodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.changePeriod(e.target));
        });

        // Обработчики авторизации
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => this.goToLogin());
        }
        if (this.registerBtn) {
            this.registerBtn.addEventListener('click', () => this.goToRegister());
        }
        if (this.profileBtn) {
            this.profileBtn.addEventListener('click', () => this.goToProfile());
        }
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    goToLogin() {
        window.location.href = 'login.html';
    }

    goToRegister() {
        window.location.href = 'register.html';
    }

    goToProfile() {
        window.location.href = 'profile.html';
    }

    logout() {
        if (this.authManager) {
            this.authManager.logout();
        }
    }

    changePeriod(button) {
        this.periodButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.currentPeriod = parseInt(button.dataset.period);
        this.analyzeCurrency();
    }

    getCurrencyIcon(currency) {
        const icons = {
            'USD': 'fa-dollar-sign',
            'EUR': 'fa-euro-sign',
            'RUB': 'fa-ruble-sign',
            'GBP': 'fa-sterling-sign',
            'JPY': 'fa-yen-sign',
            'CNY': 'fa-yen-sign',
            'CHF': 'fa-franc-sign',
            'CAD': 'fa-dollar-sign',
            'AUD': 'fa-dollar-sign',
            'TRY': 'fa-lira-sign'
        };
        return icons[currency] || 'fa-money-bill-wave';
    }

    async testAPI() {
        try {
            this.updateApiStatus('loading', 'Проверка подключения к API...');
            
            const testResponse = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
            
            if (!testResponse.ok) {
                throw new Error(`HTTP error! status: ${testResponse.status}`);
            }
            
            const testData = await testResponse.json();
            
            if (testData && testData.date && testData.usd) {
                this.updateApiStatus('connected', '✅ API подключено успешно');
            } else {
                throw new Error('Invalid API response format');
            }
            
        } catch (error) {
            console.error('API test failed:', error);
            this.updateApiStatus('error', `⚠️ Ошибка API: ${error.message}. Используются демо-данные.`);
        }
    }

    updateApiStatus(type, message) {
        this.apiStatus.className = `api-status ${type}`;
        this.apiStatus.textContent = message;
    }

    async populateCurrencyList() {
        const currencies = [
            { code: 'USD', name: 'Доллар США' },
            { code: 'EUR', name: 'Евро' },
            { code: 'RUB', name: 'Российский рубль' },
            { code: 'GBP', name: 'Фунт стерлингов' },
            { code: 'JPY', name: 'Японская иена' },
            { code: 'CNY', name: 'Китайский юань' },
            { code: 'CHF', name: 'Швейцарский франк' },
            { code: 'CAD', name: 'Канадский доллар' },
            { code: 'AUD', name: 'Австралийский доллар' },
            { code: 'TRY', name: 'Турецкая лира' }
        ];

        const baseSelect = this.baseCurrency;
        const targetSelect = this.targetCurrency;

        baseSelect.innerHTML = '';
        targetSelect.innerHTML = '';

        currencies.forEach(currency => {
            const baseOption = new Option(`${currency.code} - ${currency.name}`, currency.code);
            const targetOption = new Option(`${currency.code} - ${currency.name}`, currency.code);
            
            if (currency.code === 'RUB') baseOption.selected = true;
            if (currency.code === 'USD') targetOption.selected = true;
            
            baseSelect.add(baseOption);
            targetSelect.add(targetOption);
        });
    }

    async analyzeCurrency() {
        const base = this.baseCurrency.value;
        const target = this.targetCurrency.value;
        
        if (base === target) {
            this.showError('Выберите разные валюты для анализа');
            return;
        }

        this.showLoading(true);

        try {
            const [currentRate, historicalData] = await Promise.all([
                this.fetchCurrentRate(base, target),
                this.fetchHistoricalData(base, target, this.currentPeriod)
            ]);

            this.displayCurrentRate(currentRate);
            this.displayChart(historicalData);
            this.calculateStatistics(historicalData);
            
            // Сохраняем в историю конвертаций если пользователь авторизован и БД инициализирована
            if (this.authManager && this.authManager.isAuthenticated() && 
                this.isDbInitialized && parseFloat(this.amount.value) > 0) {
                try {
                    await this.db.addConversion(
                        this.authManager.currentUser.id,
                        base,
                        target,
                        parseFloat(this.amount.value),
                        parseFloat(this.amount.value) * currentRate.rate
                    );
                } catch (dbError) {
                    console.warn('Не удалось сохранить в историю:', dbError);
                    // Не прерываем выполнение из-за ошибки БД
                }
            }
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Не удалось получить данные. Попробуйте позже.');
        } finally {
            this.showLoading(false);
        }
    }

    async fetchCurrentRate(base, target) {
        const cacheKey = `${base}_${target}`;
        
        if (this.cache.current[cacheKey] && 
            Date.now() - this.cache.current[cacheKey].timestamp < 300000) {
            return this.cache.current[cacheKey].data;
        }

        try {
            const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const baseData = data[base.toLowerCase()];
            
            if (!baseData) {
                throw new Error(`No data for base currency: ${base}`);
            }

            const targetRate = baseData[target.toLowerCase()];
            if (targetRate === undefined) {
                throw new Error(`No conversion rate for: ${target}`);
            }

            const rateData = {
                rate: parseFloat(targetRate),
                date: new Date(data.date),
                source: 'live-api'
            };

            this.cache.current[cacheKey] = {
                data: rateData,
                timestamp: Date.now()
            };

            return rateData;
        } catch (error) {
            console.warn('API failed, using fallback:', error);
            return await this.fetchFallbackRate(base, target);
        }
    }

    async fetchFallbackRate(base, target) {
        const fallbackRates = {
            'USD_EUR': 0.92, 'USD_RUB': 95.0, 'USD_GBP': 0.79, 'USD_JPY': 150.0,
            'USD_CNY': 7.25, 'USD_CHF': 0.90, 'USD_CAD': 1.35, 'USD_AUD': 1.55,
            'USD_TRY': 32.5, 'EUR_USD': 1.09, 'EUR_RUB': 103.5, 'EUR_GBP': 0.86,
            'EUR_JPY': 163.0, 'EUR_CHF': 0.98, 'RUB_USD': 0.0105, 'RUB_EUR': 0.0097,
            'GBP_USD': 1.27, 'GBP_EUR': 1.16, 'JPY_USD': 0.0067, 'CNY_USD': 0.138
        };

        const key = `${base}_${target}`;
        if (fallbackRates[key]) {
            return {
                rate: fallbackRates[key],
                date: new Date(),
                source: 'fallback-data'
            };
        }

        const baseRate = this.generateRealisticRate(base, target);
        return {
            rate: baseRate,
            date: new Date(),
            source: 'generated-data'
        };
    }

    async fetchHistoricalData(base, target, days) {
        const cacheKey = `${base}_${target}_${days}`;
        
        if (this.cache.historical[cacheKey]) {
            return this.cache.historical[cacheKey];
        }

        const dates = [];
        const rates = [];
        const today = new Date();

        try {
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                
                if (i === 0) {
                    const currentRate = await this.fetchCurrentRate(base, target);
                    dates.push(this.formatDate(date));
                    rates.push(currentRate.rate);
                    continue;
                }

                const dateStr = this.formatDateForAPI(date);
                
                try {
                    const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/v1/currencies/${base.toLowerCase()}.json`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        const baseData = data[base.toLowerCase()];
                        
                        if (baseData && baseData[target.toLowerCase()] !== undefined) {
                            dates.push(this.formatDate(date));
                            rates.push(parseFloat(baseData[target.toLowerCase()]));
                            continue;
                        }
                    }
                } catch (error) {
                    console.warn(`Failed historical data for ${dateStr}:`, error);
                }

                const lastRate = rates.length > 0 ? rates[rates.length - 1] : await this.getBaseRate(base, target);
                const randomChange = (Math.random() - 0.5) * lastRate * 0.02;
                dates.push(this.formatDate(date));
                rates.push(parseFloat((lastRate + randomChange).toFixed(4)));
            }

            const historicalData = { dates, rates };
            
            this.cache.historical[cacheKey] = historicalData;
            setTimeout(() => {
                delete this.cache.historical[cacheKey];
            }, 600000);

            return historicalData;

        } catch (error) {
            console.warn('Historical data failed:', error);
            return this.generateHistoricalData(base, target, days);
        }
    }

    generateHistoricalData(base, target, days) {
        const dates = [];
        const rates = [];
        const today = new Date();
        const baseRate = this.generateRealisticRate(base, target);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            const volatility = 0.015;
            const randomChange = (Math.random() - 0.5) * volatility * 2;
            const rate = baseRate * (1 + randomChange * (days - i) / days);
            
            dates.push(this.formatDate(date));
            rates.push(parseFloat(rate.toFixed(4)));
        }

        return { dates, rates };
    }

    formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}.${month}.${day}`;
    }

    displayCurrentRate(rateData) {
        const amount = parseFloat(this.amount.value) || 1;
        const convertedAmount = (amount * rateData.rate).toFixed(2);

        let sourceBadge = '';
        if (rateData.source === 'fallback-data') {
            sourceBadge = '<br><small style="color: #e67e22;">⚠️ Используются демо-данные</small>';
        } else if (rateData.source === 'generated-data') {
            sourceBadge = '<br><small style="color: #e74c3c;">⚠️ Используются примерные данные</small>';
        } else {
            sourceBadge = '<br><small style="color: #27ae60;">✅ Актуальные данные с API</small>';
        }

        this.rateInfo.innerHTML = `
            <div class="rate-value">
                <i class="fas ${this.getCurrencyIcon(this.baseCurrency.value)}"></i>
                1 ${this.baseCurrency.value} = ${rateData.rate.toFixed(4)} ${this.targetCurrency.value}
            </div>
            <div style="font-size: 1.2em; margin: 15px 0;">
                <strong>${amount} ${this.baseCurrency.value}</strong> = 
                <strong style="color: #27ae60;">${convertedAmount} ${this.targetCurrency.value}</strong>
            </div>
            <div style="color: #666; font-size: 0.9em;">
                Дата: ${this.formatDate(rateData.date)}
                ${sourceBadge}
            </div>
        `;
    }

    displayChart(historicalData) {
        const ctx = document.getElementById('currencyChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historicalData.dates,
                datasets: [{
                    label: `${this.baseCurrency.value}/${this.targetCurrency.value}`,
                    data: historicalData.rates,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2980b9',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(4);
                            }
                        }
                    }
                }
            }
        });
    }

    calculateStatistics(historicalData) {
        const rates = historicalData.rates;
        
        if (rates.length < 2) {
            this.statsInfo.innerHTML = '<p>Недостаточно данных для статистики</p>';
            return;
        }

        const min = Math.min(...rates);
        const max = Math.max(...rates);
        const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
        const change = rates[rates.length - 1] - rates[0];
        const changePercent = ((change / rates[0]) * 100).toFixed(2);
        
        const changes = [];
        for (let i = 1; i < rates.length; i++) {
            changes.push(Math.abs((rates[i] - rates[i-1]) / rates[i-1]));
        }
        const volatility = (changes.reduce((a, b) => a + b, 0) / changes.length * 100).toFixed(2);

        this.statsInfo.innerHTML = `
            <div class="stat-item">
                <span>Период анализа:</span>
                <span class="stat-value">${this.currentPeriod} дней</span>
            </div>
            <div class="stat-item">
                <span>Минимальный курс:</span>
                <span class="stat-value">${min.toFixed(4)}</span>
            </div>
            <div class="stat-item">
                <span>Максимальный курс:</span>
                <span class="stat-value">${max.toFixed(4)}</span>
            </div>
            <div class="stat-item">
                <span>Средний курс:</span>
                <span class="stat-value">${average.toFixed(4)}</span>
            </div>
            <div class="stat-item">
                <span>Изменение за период:</span>
                <span class="stat-value" style="color: ${change >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${change >= 0 ? '+' : ''}${change.toFixed(4)} (${changePercent}%)
                </span>
            </div>
            <div class="stat-item">
                <span>Волатильность:</span>
                <span class="stat-value">${volatility}%</span>
            </div>
        `;
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    generateRealisticRate(base, target) {
        const baseRates = {
            'USD': 1, 'EUR': 0.92, 'RUB': 95.0, 'GBP': 0.79, 'JPY': 150.0,
            'CNY': 7.25, 'CHF': 0.90, 'CAD': 1.35, 'AUD': 1.55, 'TRY': 32.5
        };

        if (baseRates[base] && baseRates[target]) {
            return parseFloat((baseRates[target] / baseRates[base]).toFixed(4));
        }

        return 1 + Math.random() * 2;
    }

    async getBaseRate(base, target) {
        try {
            const currentRate = await this.fetchCurrentRate(base, target);
            return currentRate.rate;
        } catch (error) {
            return this.generateRealisticRate(base, target);
        }
    }

    updateConversion() {
        const currentRateElement = this.rateInfo.querySelector('.rate-value');
        if (currentRateElement) {
            const rateText = currentRateElement.textContent;
            const rateMatch = rateText.match(/= ([\d.]+)/);
            if (rateMatch) {
                const rate = parseFloat(rateMatch[1]);
                const amount = parseFloat(this.amount.value) || 1;
                const convertedAmount = (amount * rate).toFixed(2);
                
                const conversionElement = this.rateInfo.querySelector('div:nth-child(2)');
                if (conversionElement) {
                    conversionElement.innerHTML = `
                        <strong>${amount} ${this.baseCurrency.value}</strong> = 
                        <strong style="color: #27ae60;">${convertedAmount} ${this.targetCurrency.value}</strong>
                    `;
                }
            }
        }
    }

    showLoading(show) {
        this.loading.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        this.rateInfo.innerHTML = `
            <div style="color: #e74c3c; text-align: center; padding: 20px;">
                <h4>⚠️ Ошибка</h4>
                <p>${message}</p>
            </div>
        `;
        this.statsInfo.innerHTML = '<p>Данные недоступны</p>';
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    const currencyAnalyzer = new CurrencyAnalyzer();
    
    // Задержка для инициализации БД перед первым анализом
    setTimeout(() => {
        currencyAnalyzer.analyzeCurrency();
    }, 1500);
});