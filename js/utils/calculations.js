class Calculations {
    static calculateLayingPercentage(eggsLaid, birdsCount, daysInPeriod = 1) {
        if (birdsCount === 0 || daysInPeriod === 0) return 0;
        return ((eggsLaid / (birdsCount * daysInPeriod)) * 100);
    }

    static calculateFeedConversionRatio(feedConsumed, eggsProduced, avgEggWeight = 60) {
        const totalEggWeight = (eggsProduced * avgEggWeight) / 1000; // Convert to kg
        if (totalEggWeight === 0) return 0;
        return feedConsumed / totalEggWeight;
    }

    static calculateFeedEfficiency(eggsProduced, feedConsumed, avgEggWeight = 60) {
        if (feedConsumed === 0) return 0;
        const totalEggWeight = (eggsProduced * avgEggWeight) / 1000; // Convert to kg
        return totalEggWeight / feedConsumed;
    }

    static calculateMortality(deaths, totalBirds) {
        if (totalBirds === 0) return 0;
        return (deaths / totalBirds) * 100;
    }

    static calculateProductionCost(feedCost, laborCost, otherCosts = 0) {
        return feedCost + laborCost + otherCosts;
    }

    static calculateProfitability(revenue, costs) {
        return revenue - costs;
    }

    static calculateAverageEggWeight(totalWeight, eggCount) {
        if (eggCount === 0) return 0;
        return totalWeight / eggCount;
    }

    static calculateDailyFeedPerBird(totalFeed, birdsCount, days = 1) {
        if (birdsCount === 0 || days === 0) return 0;
        return (totalFeed * 1000) / (birdsCount * days); // Convert kg to grams
    }

    static calculatePeakProduction(productionData) {
        if (!productionData || productionData.length === 0) return 0;
        return Math.max(...productionData.map(d => d.layingPercentage || 0));
    }

    static calculateCumulativeProduction(logs) {
        if (!logs || logs.length === 0) return 0;
        return logs.reduce((total, log) => total + (log.eggsCollected || log.eggsProduced || 0), 0);
    }

    static calculateAverageProduction(logs, days) {
        if (!logs || logs.length === 0 || days === 0) return 0;
        const totalEggs = this.calculateCumulativeProduction(logs);
        return totalEggs / days;
    }

    static calculateEfficiencyTrend(currentPeriod, previousPeriod) {
        if (!previousPeriod || previousPeriod === 0) return 0;
        return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
    }

    static calculateBreakEvenPoint(fixedCosts, pricePerEgg, variableCostPerEgg) {
        const contributionPerEgg = pricePerEgg - variableCostPerEgg;
        if (contributionPerEgg <= 0) return Infinity;
        return Math.ceil(fixedCosts / contributionPerEgg);
    }

    static calculateROI(profit, investment) {
        if (investment === 0) return 0;
        return (profit / investment) * 100;
    }

    static projectProduction(currentRate, growthRate, weeks) {
        return currentRate * Math.pow((1 + growthRate / 100), weeks);
    }

    static calculateSeasonalIndex(monthlyData) {
        const average = monthlyData.reduce((sum, val) => sum + val, 0) / monthlyData.length;
        return monthlyData.map(value => (value / average) * 100);
    }

    static calculateOptimalFeedAmount(birdWeight, layingRate, weatherFactor = 1) {
        // Base feed requirement: 4% of body weight + 2g per egg
        const baseFeed = birdWeight * 0.04;
        const eggFeed = (layingRate / 100) * 2;
        return (baseFeed + eggFeed) * weatherFactor;
    }

    static calculateWaterRequirement(temperature, birdWeight, layingRate) {
        // Base water: 2-3 times feed intake
        const baseFeed = this.calculateOptimalFeedAmount(birdWeight, layingRate);
        const baseWater = baseFeed * 2.5;
        
        // Temperature adjustment
        const tempFactor = temperature > 25 ? 1 + ((temperature - 25) * 0.05) : 1;
        
        return baseWater * tempFactor;
    }

    static formatPercentage(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    }

    static formatCurrency(value, currency = '₵') {
        return `${currency}${value.toFixed(2)}`;
    }

    static formatDate(date, period = 'day') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        switch (period) {
            case 'year':
                return `${year}`;
            case 'month':
                return `${month}/${year}`;
            case 'week':
                // For weekly, show week starting date
                return `${day}/${month}/${year}`;
            case 'day':
            default:
                return `${day}/${month}/${year}`;
        }
    }

    static formatWeight(value, unit = 'kg') {
        return `${value.toFixed(2)} ${unit}`;
    }

    static groupDataByPeriod(data, period = 'week') {
        const grouped = {};
        
        data.forEach(item => {
            const date = new Date(item.date);
            let key;
            
            switch (period) {
                case 'day':
                    key = item.date;
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
                    break;
                case 'quarter':
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    key = `${date.getFullYear()}-Q${quarter}`;
                    break;
                case 'year':
                    key = `${date.getFullYear()}-01-01`;
                    break;
                default:
                    key = item.date;
            }
            
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });
        
        return grouped;
    }

    static calculateMovingAverage(data, windowSize) {
        const result = [];
        for (let i = windowSize - 1; i < data.length; i++) {
            const window = data.slice(i - windowSize + 1, i + 1);
            const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
            result.push(average);
        }
        return result;
    }

    // Add cycle-based metrics calculation methods
    static calculateCycleMetrics(productionLogs, cages, feedLogs) {
        const totalBirds = cages.reduce((sum, cage) => sum + (cage.currentBirds || 0), 0);
        const totalEggs = productionLogs.reduce((sum, log) => sum + (log.eggsCollected || log.eggsProduced || 0), 0);
        const totalFeed = feedLogs.reduce((sum, log) => sum + (log.feedConsumed || log.amount || 0), 0);
        
        const cycleLength = productionLogs.length > 0 ? 
            Math.max(...productionLogs.map(log => log.flockAge || 0)) : 0;
        
        return {
            totalBirds,
            totalEggs,
            totalFeed,
            cycleLength,
            avgLayingRate: this.calculateLayingPercentage(totalEggs, totalBirds, cycleLength),
            feedConversionRatio: this.calculateFeedConversionRatio(totalFeed, totalEggs),
            feedEfficiency: this.calculateFeedEfficiency(totalEggs, totalFeed)
        };
    }

    static calculateHenHouseProduction(eggsProduced, flockAge, layingStartAge = 133) {
        // Hen house production = eggs per bird from laying period (19 weeks = 133 days)
        if (flockAge < layingStartAge) return 0;
        const layingDays = flockAge - layingStartAge;
        return layingDays > 0 ? eggsProduced / layingDays : 0;
    }

    static calculateCumulativeMetrics(logs) {
        const totalMortality = logs.reduce((sum, log) => sum + (log.mortality || 0), 0);
        const totalEggs = logs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        const totalFeed = logs.reduce((sum, log) => sum + (log.currentFeed || 0), 0);
        
        return {
            totalMortality,
            totalEggs,
            totalFeed,
            avgProduction: logs.length > 0 ? totalEggs / logs.length : 0
        };
    }
}