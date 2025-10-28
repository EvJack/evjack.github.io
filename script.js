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

        this.cache = {
            current: {},
            historical: {}
        };

        this.initializeEventListeners();
        this.populateCurrencyList();
        this.testAPI();
    }

    initializeEventListeners() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeCurrency());
        
        this.baseCurrency.addEventListener('change', () => this.analyzeCurrency());
        this.targetCurrency.addEventListener('change', () => this.analyzeCurrency());
        this.amount.addEventListener('input', () => this.updateConversion());
    }

    async testAPI() {
        try {
            this.updateApiStatus('loading', 'Проверка подключения к API...');
            
            // Тестируем API на примере USD к EUR
            const testResponse = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
            
            if (!testResponse.ok) {
                throw new Error(`HTTP error! status: ${testResponse.status}`);
            }
            
            const testData = await testResponse.json();
            
            if (testData && testData.eur) {
                this.updateApiStatus('connected', '✅ API подключено успешно');
                console.log('API test successful:', testData);
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
        const popularCurrencies = [
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

        // Очищаем и заполняем селекты
        baseSelect.innerHTML = '';
        targetSelect.innerHTML = '';

        popularCurrencies.forEach(currency => {
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
                this.fetchHistoricalData(base, target)
            ]);

            this.displayCurrentRate(currentRate);
            this.displayHistoricalChart(historicalData);
            this.calculateStatistics(historicalData);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Не удалось получить данные. Попробуйте позже.');
        } finally {
            this.showLoading(false);
        }
    }

    async fetchCurrentRate(base, target) {
        const cacheKey = `${base}_${target}`;
        
        // Проверяем кэш (5 минут)
        if (this.cache.current[cacheKey] && 
            Date.now() - this.cache.current[cacheKey].timestamp < 300000) {
            return this.cache.current[cacheKey].data;
        }

        try {
            // Используем корректный URL для API
            const baseLower = base.toLowerCase();
            const targetLower = target.toLowerCase();
            
            const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@1/latest/currencies/${baseLower}/${targetLower}.json`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API Response:', data); // Для отладки
            
            if (data && data[targetLower] !== undefined) {
                const rateData = {
                    rate: parseFloat(data[targetLower]),
                    date: new Date(data.date || Date.now()),
                    source: 'live-api'
                };

                // Сохраняем в кэш
                this.cache.current[cacheKey] = {
                    data: rateData,
                    timestamp: Date.now()
                };

                return rateData;
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            console.warn('Primary API failed, using fallback:', error);
            return await this.fetchFallbackRate(base, target);
        }
    }

    async fetchFallbackRate(base, target) {
        // Обновленные фиксированные курсы (более актуальные)
        const fallbackRates = {
            'USD_EUR': 0.92,
            'USD_RUB': 95.0,
            'USD_GBP': 0.79,
            'USD_JPY': 150.0,
            'USD_CNY': 7.25,
            'USD_CHF': 0.90,
            'USD_CAD': 1.35,
            'USD_AUD': 1.55,
            'USD_TRY': 32.5,
            'EUR_USD': 1.09,
            'EUR_RUB': 103.5,
            'EUR_GBP': 0.86,
            'EUR_JPY': 163.0,
            'EUR_CHF': 0.98,
            'RUB_USD': 0.0105,
            'RUB_EUR': 0.0097,
            'RUB_CNY': 0.076,
            'GBP_USD': 1.27,
            'GBP_EUR': 1.16,
            'GBP_JPY': 190.0,
            'JPY_USD': 0.0067,
            'CNY_USD': 0.138,
            'CHF_USD': 1.11
        };

        const key = `${base}_${target}`;
        if (fallbackRates[key]) {
            return {
                rate: fallbackRates[key],
                date: new Date(),
                source: 'fallback-data'
            };
        }

        // Генерируем реалистичный курс
        const baseRate = this.generateRealisticRate(base, target);
        return {
            rate: baseRate,
            date: new Date(),
            source: 'generated-data'
        };
    }

    generateRealisticRate(base, target) {
        const baseRates = {
            'USD': 1,
            'EUR': 0.92,
            'RUB': 95.0,
            'GBP': 0.79,
            'JPY': 150.0,
            'CNY': 7.25,
            'CHF': 0.90,
            'CAD': 1.35,
            'AUD': 1.55,
            'TRY': 32.5
        };

        if (baseRates[base] && baseRates[target]) {
            return parseFloat((baseRates[target] / baseRates[base]).toFixed(4));
        }

        return 1 + Math.random() * 2;
    }

    async fetchHistoricalData(base, target) {
        const cacheKey = `${base}_${target}_historical`;
        
        if (this.cache.historical[cacheKey]) {
            return this.cache.historical[cacheKey];
        }

        const dates = [];
        const rates = [];
        const today = new Date();

        try {
            // Получаем текущий курс для базового значения
            const currentRateData = await this.fetchCurrentRate(base, target);
            let baseRate = currentRateData.rate;

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const dateStr = this.formatDateForAPI(date);

                if (i === 0) {
                    // Для сегодня используем текущий курс
                    dates.push(this.formatDate(date));
                    rates.push(baseRate);
                    continue;
                }

                try {
                    // Пытаемся получить исторические данные
                    const baseLower = base.toLowerCase();
                    const targetLower = target.toLowerCase();
                    const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@1/${dateStr}/currencies/${baseLower}/${targetLower}.json`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data[targetLower] !== undefined) {
                            dates.push(this.formatDate(date));
                            rates.push(parseFloat(data[targetLower]));
                            continue;
                        }
                    }
                } catch (error) {
                    console.warn(`Failed historical data for ${dateStr}:`, error);
                }

                // Генерируем данные на основе тренда
                const trend = Math.random() > 0.5 ? 1 : -1;
                const change = baseRate * 0.01 * trend * Math.random();
                const historicalRate = baseRate + change;
                
                dates.push(this.formatDate(date));
                rates.push(parseFloat(historicalRate.toFixed(4)));
            }

            const historicalData = { dates, rates };
            
            // Кэшируем на 10 минут
            this.cache.historical[cacheKey] = historicalData;
            setTimeout(() => {
                delete this.cache.historical[cacheKey];
            }, 600000);

            return historicalData;

        } catch (error) {
            console.warn('Historical data failed, generating:', error);
            return this.generateHistoricalData(base, target);
        }
    }

    generateHistoricalData(base, target) {
        const dates = [];
        const rates = [];
        const today = new Date();

        // Базовый курс для генерации
        const baseRate = this.generateRealisticRate(base, target);

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            // Реалистичные колебания
            const volatility = 0.015; // 1.5%
            const randomChange = (Math.random() - 0.5) * volatility * 2;
            const rate = baseRate * (1 + randomChange * (6 - i) / 6);
            
            dates.push(this.formatDate(date));
            rates.push(parseFloat(rate.toFixed(4)));
        }

        return { dates, rates };
    }

    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
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
            sourceBadge = '<br><small style="color: #27ae60;">✅ Актуальные данные</small>';
        }

        this.rateInfo.innerHTML = `
            <div class="rate-value">1 ${this.baseCurrency.value} = ${rateData.rate.toFixed(4)} ${this.targetCurrency.value}</div>
            <div style="font-size: 1.2em; margin: 15px 0;">
                <strong>${amount} ${this.baseCurrency.value}</strong> = 
                <strong style="color: #27ae60;">${convertedAmount} ${this.targetCurrency.value}</strong>
            </div>
            <div style="color: #666; font-size: 0.9em;">
                Обновлено: ${this.formatDateTime(rateData.date)}
                ${sourceBadge}
            </div>
        `;
    }

    displayHistoricalChart(historicalData) {
        const ctx = document.getElementById('currencyChart').getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historicalData.dates,
                datasets: [{
                    label: `Курс ${this.baseCurrency.value} к ${this.targetCurrency.value}`,
                    data: historicalData.rates,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2980b9',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
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
                                return `Курс: ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
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
        
        // Волатильность как среднее изменение
        const changes = [];
        for (let i = 1; i < rates.length; i++) {
            changes.push(Math.abs((rates[i] - rates[i-1]) / rates[i-1]));
        }
        const volatility = (changes.reduce((a, b) => a + b, 0) / changes.length * 100).toFixed(2);

        this.statsInfo.innerHTML = `
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
                <span>Изменение за неделю:</span>
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

    formatDate(date) {
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit'
        }).format(date);
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
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
    const analyzer = new CurrencyAnalyzer();
    
    // Автоматический запуск анализа
    setTimeout(() => {
        analyzer.analyzeCurrency();
    }, 1000);
});