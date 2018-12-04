import _ from 'lodash';
// import locales from 'locales';
import Cookies from 'js-cookie';
import { CMD, HOURS } from './platformData';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client/dist/sockjs.js';
import { connectPlatformSuccess,
connectPlatformError,
updateUserAccountCurrency,
updateUserAccounts,
updateUserStatistics } from '../redux/actions/platformActions';
import { createOpenDealApi,
getOpenDealsSuccess,
getCloseDealsSuccess,
changeOpenDealPlatformSuccess,
closeOpenDealPlatformSuccess,
// getLastClosedDealForStatistics,
// updateOpenDealsForStatistics,
updateClosedDealsForStatistics
} from '../redux/actions/dealsActions';
import { disconnectBroker, reconnectBroker } from '../redux/actions/brokersActions';
import { getFavoritesSuccess, updateFavoriteSuccess } from '../redux/actions/favoriteQuotesActions';
import config from '../configApi/config';
import { getChartDataSuccess } from '../redux/actions/chartsActions';
// import {getLanguageState} from '../../redux/selectors/languageSelectors';
// import { showNotification } from '../redux/actions/notificationActions';
import { updateQuotes } from '../redux/actions/quotesActions';
import { updateQuotesSettings } from '../redux/actions/quotesSettingsActions';

export class Umarkets {
    constructor () {
        this.accountCurrency = 'USD';
        this.currentAccount = '';
        this.getClosedDealsForStatistics = false;
        this.lastClosedDealTime = null;
        this.quotes = {};
        this.quotesSettings = {};
        this.openDeals = {};
        this.charts = {};
        this.userStatistics = {};
        this.statesQuotes = {};
        this.userSettings = {};
        this.allFavorites = [];
        this.dataDealToApi = null;
        this.websocket = null;
        this.sid = null;
        this.reconnectionCounter = null;
        this.um_session = null;
        this.stompUser = null;
        this.stompPassword = null;
        this.stompClient = null;
        this.platformName = null;
        this.hours = HOURS;
    }
    initialize (store) {
        this.store = store;
        this.dispatch = store.dispatch;
    }
    createWebSocketConnection () {
        this.stompUser = localStorage.getItem('stompUser');
        this.stompPassword = localStorage.getItem('stompPassword');
        this.sid = localStorage.getItem('sid');
        this.um_session = localStorage.getItem('um_session');
        this.platformName = Cookies.get('platformName');
        this.websocket = this.createSockJS();
        this.stompClient = Stomp.over(this.websocket);
        this.stompClient.debug = null;
        this.stompClient.heartbeat.outgoing = 0;
        this.stompClient.heartbeat.incoming = 0;
        this.stompClient.connect(this.stompUser, this.stompPassword, this.onConnect.bind(this), this.onError.bind(this), 'trading');
    }
    createSockJS () {
        const websrv = parseInt(localStorage.getItem('WEBSRV'));
        let url = `${config[process.env.NODE_ENV].brokerWSUrl[this.platformName]}websrv${websrv}`;
        return new SockJS(url);
    }
    closeWebSocketConnection () {
        if (this.websocket && this.stompClient) {
            this.websocket.close();
            this.stompClient.disconnect();
        }
    }
    onConnect () {
        // const data = { broker_name: this.platformName };
        // setTimeout(() => this.dispatch(getLastClosedDealForStatistics(data)), 7000);
        this.dispatch(connectPlatformSuccess(this.platformName));
        if (this.stompClient !== null && this.sid !== null) {
            this.platformSubscribe();
            this.getStartData();
        }
        setInterval(this.getUserStatistics.bind(this), 30000);
    }
    onError (error) {
        this.dispatch(connectPlatformError(error));
        this.reconnect();
    }
    reconnect () {
        if (this.reconnectionCounter !== 1) {
            this.reconnectionCounter = 1;
            if (this.websocket) {
                this.websocket.close();
            }
            const data = {
                broker_name: this.platformName,
                stomp_user: this.stompUser,
                stomp_password: this.stompPassword
            };
            this.dispatch(reconnectBroker(data));
        } else {
            this.dispatch(disconnectBroker());
        }
    }
    platformSubscribe () {
        this.stompClient.subscribe('/amq/queue/session.' + this.sid, this.onWebSocketMessage.bind(this));
    }
    getStartData () {
        this.getServerTime();
        this.getUserSettings();
        this.getUserStatistics();
        this.getUserRates();
        this.getOpenDeals();
        this.getClosedDeals();
        this.getFavorites();
    }
    getServerTime () { this.sendRequestToPlatform(CMD.getTime, '[]') }
    getUserAccount () { this.sendRequestToPlatform(CMD.getUserAccount, '[]') }
    getUserSettings () { this.sendRequestToPlatform(CMD.getUserSettings, '[]') }
    getUserStatistics () { this.sendRequestToPlatform(CMD.getUserStatistics, '[]') }
    getUserRates () { this.sendRequestToPlatform(CMD.getUserRates, '[]') }
    getFavorites () { this.sendRequestToPlatform(CMD.getFavorites, '[]') }
    addFavorites (currency) { this.sendRequestToPlatform(CMD.addFavorites, `[${currency}]`) }
    delFavorites (currency) { this.sendRequestToPlatform(CMD.delFavorites, `[${currency}]`) }
    updateFavorite (quoteSecurity) {
        if (this.allFavorites.includes(quoteSecurity)) {
            this.delFavorites(quoteSecurity);
        } else {
            this.addFavorites(quoteSecurity);
        }
    }
    getOpenDeals () { this.sendRequestToPlatform(CMD.getOpenDeals, '[]') }
    getClosedDeals (period = 'LAST_7_DAYS', getClosedDealsForStatistics = false, lastClosedDealTime = null) {
        this.getClosedDealsForStatistics = getClosedDealsForStatistics;
        this.lastClosedDealTime = lastClosedDealTime;
        this.sendRequestToPlatform(CMD.getClosedDeals, `[${period}, null, null]`);
    }
    createOpenDeal (deal, dataDealToApi) {
        this.dataDealToApi = dataDealToApi;
        this.sendRequestToPlatform(CMD.sendOpenMarketOrder, `["${deal.security}","${deal.side}","${deal.amount}","${config.appVersion}"]`);
    }
    closeOpenDeal (dealId, allMarker) {
        this.sendRequestToPlatform(CMD.sendCloseMarketOrder, `["${dealId}","${config.appVersion}${allMarker || ''}"]`);
    }
    changeAccount (accountName) { this.sendRequestToPlatform(CMD.changeAccount, `[${accountName}]`) }
    duplicateOpenDeal (dealId, dataDealToApi) {
        this.dataDealToApi = dataDealToApi;
        this.sendRequestToPlatform(CMD.duplicateOpenDeal, `[${dealId},"${config.appVersion}"]`);
    }
    changeOpenDeal (id, slRate = null, slAmount = null, tpRate = null, tpAmount = null) {
        this.sendRequestToPlatform(CMD.changeOpenDeal, `[${id},${slRate},${slAmount},${tpRate},${tpAmount},"${config.appVersion}"]`);
    }
    getLimitStopOrders () { this.sendRequestToPlatform(CMD.getLimitStopOrders, '[]') }
    getChartData (active, interval) {
        if (active && interval) {
            if (this.stompClient !== null && this.sid !== null && this.um_session !== null) {
                let chartsArr = [ [active, interval] ];
                chartsArr = JSON.stringify(chartsArr);
                this.stompClient.send('/exchange/CMD/', {}, '{"sid":"' + this.sid + '", "umid": "' + this.um_session + '", "cmd" : "' + CMD.getChartData + '", "array": ' + chartsArr + '}');
            }
        }
    }
    sendRequestToPlatform (cmd, params) {
        if (
            this.stompClient !== null &&
            this.sid !== null &&
            this.um_session !== null
        ) {
            try {
                this.stompClient.send('/exchange/CMD/', {}, `{"sid": "${this.sid}", "umid": "${this.um_session}", "cmd": "${cmd}", "params": ${params}}`);
            } catch (e) {
                // console.log('Stomp error ' + e.name + ':' + e.message + '\n' + e.stack);
            }
        }
    }
    onWebSocketMessage (message) {
        const result = JSON.parse(message.body);
        if (result.type === 'response' || result.type === 'update') {
            switch (result.cmd) {
            case CMD.getUserRates: this.parseUserRates(result);
                break;
            case CMD.getUserStatistics: this.parseUserStatistics(result);
                break;
            case CMD.getUserSettings: this.parseUserSettings(result);
                break;
            case CMD.getUserAccount: this.parseUserAccount(result);
                break;
            case CMD.getOpenDeals: this.parseOpenDeals(result);
                break;
            case CMD.getClosedDeals: this.parseClosedDeals(result);
                break;
            case CMD.getFavorites: this.parseFavorites(result);
                break;
            case CMD.getChartData: this.parseChartData(result);
                break;
            case CMD.sendCloseMarketOrder: this.parseCloseMarketOrderResult(result);
                break;
            case CMD.changeOpenDeal: this.parseChangeMarketOrderResult(result);
                break;
            case CMD.sendOpenMarketOrder:
            case CMD.openMarketOrderRejected:
            case CMD.duplicateOpenDeal: this.parseOpenMarketOrderResult(result);
                break;
            }
        } else if (result.type === 'event') {
            switch (result.name) {
            case 'deal_opened_by_market_order': this.parseOpenByMarketOrder(result);
                break;
            case 'deal_closed_by_market_order': this.parseCloseByMarketOrder(result);
                break;
            case 'open_deal_changed': this.parseChangeByMarketOrder(result);
                break;
            case 'favorites_security_added':
            case 'favorites_security_removed': this.parseUpdateFavorites(result);
                break;
            }
        }
    }
    parseUserAccount (result) {
        if (result.content && result.content.currency) {
            this.dispatch(updateUserAccountCurrency(result.content.currency));
            this.accountCurrency = result.content.currency;
            this.getServerTime();
            this.getUserStatistics();
            this.getOpenDeals();
            this.getClosedDeals();
        }
    }
    parseUserRates (result) {
        const content = result.content;
        const rates = content.rates;
        const data = {};
        rates.forEach((q) => {
            if (_.size(this.quotes) !== 0 && q.security in this.quotes) {
                this.fixChange(q.security, q, this.quotes[q.security]);
            }
            this.quotes[q.security] = {
                security: q.security,
                bidPrice: (q.bidPrice / 1000000).toString(),
                askPrice: (q.askPrice / 1000000).toString(),
                dailyChange: q.dailyChange,
                timestamp: q.timestamp,
                state: this.statesQuotes[q.security]
            };
            data[q.security] = {
                security: q.security,
                bidPrice: (q.bidPrice / 1000000).toString(),
                askPrice: (q.askPrice / 1000000).toString(),
                dailyChange: q.dailyChange,
                timestamp: q.timestamp,
                state: this.statesQuotes[q.security]
            };
            if (this.hasOwnProperty('publish')) {
                this.publish(q.security, this.quotes[q.security]);
            }
        });
        this.dispatch(updateQuotes(data));
    }
    fixChange (security, quote, oldQuote) {
        const newPrice = quote.bidPrice;
        const oldPrice = oldQuote.bidPrice * 1000000;
        if (newPrice !== oldPrice) {
            this.statesQuotes[security] = newPrice > oldPrice ? 'up' : 'down';
        }
    }
    parseUserSettings (result) {
        const content = result.content;
        const quotesSettings = content.securitySettings;
        const tradingSessions = content.tradingSessions;
        this.userSettings = content;
        const keys = Object.keys(quotesSettings);
        let sortedQuotesSettings = {};
        const currentTime = Date.now();
        keys.sort();
        for (let i in keys) {
            let key = keys[i];
            sortedQuotesSettings[key] = quotesSettings[key];
            sortedQuotesSettings[key].isSession = _.some(tradingSessions[sortedQuotesSettings[key].calendarCodeId], item =>
                currentTime < item.sessionEnd && currentTime > item.sessionStart
            );
        }
        this.dispatch(updateQuotesSettings(this.quotesSettings));
        if (content.accounts && content.currentAccountName) {
            this.dispatch(updateUserAccounts({
                currentAccountName: content.currentAccountName,
                accounts: content.accounts
            }));
            const currentAccount = _.filter(content.accounts, option => option.name === content.currentAccountName);
            if (
                currentAccount[0] &&
                currentAccount[0].id &&
                this.currentAccount !== currentAccount[0].id
            ) {
                this.getUserAccount(currentAccount[0].id);
                this.currentAccount = currentAccount[0].id;
            }
        }
        this.quotesSettings = sortedQuotesSettings;
        this.dispatch(updateQuotesSettings(this.quotesSettings));
    }
    parseChartData (result) {
        const chart = result.content;
        const quoteSecurity = chart.security;
        const timeScale = chart.barType;
        const bars = chart.bars;
        this.dispatch(getChartDataSuccess({quoteSecurity, timeScale, bars}));
        if (this.hasOwnProperty('publish')) {
            this.publish(`ChartData${quoteSecurity}`, {quoteSecurity, timeScale, bars});
        }
    }
    parseOpenDeals (result) {
        const content = _.sortBy(result.content, 'dealSequenceNumber').reverse();
        const openDeals = {};
        const data = { open_deals: [] };
        content.map((openDeal) => {
            openDeal.openPrice = openDeal.openPrice / 1000000;
            openDeal.amount = openDeal.amount / 1000000;
            openDeals[openDeal.dealId] = openDeal;
            data.open_deals.push({
                amount: openDeal.amount,
                deal_id: openDeal.dealId,
                deal_sequence_number: openDeal.dealSequenceNumber,
                good_till_date: openDeal.goodTillDate,
                open_price: openDeal.openPrice,
                open_time: openDeal.openTime,
                security: openDeal.security,
                side: openDeal.side
            });
        });
        this.dispatch(getOpenDealsSuccess(openDeals));
        // this.dispatch(updateOpenDealsForStatistics(data));
    }
    parseClosedDeals (result) {
        if (!this.getClosedDealsForStatistics) {
            const content = _.sortBy(result.content.closedDeals, 'closeTime').reverse();
            const closedDeals = {};
            content.map((closeDeal) => {
                closeDeal.amount = closeDeal.amount / 1000000;
                closeDeal.pnl = closeDeal.pnl / 1000000;
                closeDeal.openPrice = closeDeal.openPrice / 1000000;
                closeDeal.closePrice = closeDeal.closePrice / 1000000;
                closedDeals[closeDeal.dealId] = closeDeal;
            });
            this.dispatch(getCloseDealsSuccess(closedDeals));
        } else {
            this.getClosedDealsForStatistics = false;
            const content = _.sortBy(result.content.closedDeals, 'closeTime');
            const contentFilter = content.filter((closedDeal) => closedDeal.closeTime > this.lastClosedDealTime);
            if (contentFilter.length > 0) {
                let data = { closed_deals: [] };
                content.map((closeDeal) => {
                    data.closed_deals.push({
                        deal_id: closeDeal.dealId,
                        deal_sequence_number: closeDeal.dealSequenceNumber,
                        security: closeDeal.security,
                        side: closeDeal.side,
                        amount: closeDeal.amount / 1000000,
                        open_price: closeDeal.openPrice / 1000000,
                        open_time: closeDeal.openTime,
                        close_price: closeDeal.closePrice / 1000000,
                        close_time: closeDeal.closeTime,
                        rollover_commission: closeDeal.rolloverCommission,
                        pnl: closeDeal.pnl / 1000000,
                        broker_name: this.platformName
                    });
                });
                this.dispatch(updateClosedDealsForStatistics(data));
            }
        }
    }
    parseUserStatistics (result) {
        let content = result.content;
        this.userStatistics = {
            balance: content.balance,
            freeBalance: content.freeBalance,
            marginUsed: content.marginUsed,
            totalEquity: content.totalEquity,
            unrealizedPnl: content.unrealizedPnl
        };
        this.dispatch(updateUserStatistics(this.userStatistics));
    }
    parseFavorites (result) {
        const content = result.content;
        this.allFavorites = content.favorites;
        this.dispatch(getFavoritesSuccess(content.favorites));
    }
    parseUpdateFavorites (result) {
        const content = result.content;
        if (this.allFavorites.includes(content.security)) {
            this.allFavorites = this.allFavorites.filter(favorites => favorites !== content.security);
        } else {
            this.allFavorites = [...this.allFavorites, content.security];
        }
        this.dispatch(updateFavoriteSuccess(content.security));
    }
    parseOpenMarketOrderResult (result) {
        if (result.response === 'INSUFFICIENT_BALANCE') {
            this.dataDealToApi = null;
            console.log('INSUFFICIENT_BALANCE')
            // this.dispatch(showNotification({status: 'error',
            //     message: locales[getLanguageState(this.store.getState())].messages['umarket.insufficienBalance']}));
        } else if (result.response === 'NOT_TRADING_TIME') {
            this.dataDealToApi = null;
            console.log('NOT_TRADING_TIME')
          // this.dispatch(showNotification({status: 'error',
            //     message: locales[getLanguageState(this.store.getState())].messages['umarket.notTradingTime']}));
        }
    }
    parseCloseMarketOrderResult (result) {
    //     if (result.response === 'NOT_TRADING_TIME') {
    //         this.dispatch(showNotification({status: 'error',
    //             message: locales[getLanguageState(this.store.getState())].messages['umarket.notTradingTime']}));
    //     } else if (result.response === 'CLOSE_DEAL_INTERVAL_IS_TOO_SMALL') {
    //         this.dispatch(showNotification({status: 'error',
    //             message: locales[getLanguageState(this.store.getState())].messages['umarket.closeDealIntervalIsTooSmall']}));
    //     }
    }
    parseChangeMarketOrderResult (result) {
        // if (result.response === 'NOT_TRADING_TIME') {
        //     this.dispatch(showNotification({status: 'error',
        //         message: locales[getLanguageState(this.store.getState())].messages['umarket.notTradingTime']}));
        // } else if (result.response === 'INVALID_ORDER_PRICE') {
        //     this.dispatch(showNotification({status: 'error',
        //         message: locales[getLanguageState(this.store.getState())].messages['umarket.invalidOrderPrice']}));
        // }
    }
    parseOpenByMarketOrder (result) {
        this.getOpenDeals();
        // this.dispatch(showNotification({status: 'success',
        //     message: locales[getLanguageState(this.store.getState())].messages['umarket.openedDealSuccess']}));
        if (this.dataDealToApi) {
            this.dataDealToApi.deal_id = result.content.dealId;
            this.dispatch(createOpenDealApi(this.dataDealToApi));
            this.dataDealToApi = null;
        }
    }
    parseCloseByMarketOrder (result) {
        // this.dispatch(showNotification({status: 'success',
        //     message: locales[getLanguageState(this.store.getState())].messages['umarket.closedDealSuccess']}));
        this.dispatch(closeOpenDealPlatformSuccess(result.content.dealId));
    }
    parseChangeByMarketOrder (result) {
        const content = result.content;
        if (content.stopLossAmount) {
            content.stopLossPrice = null;
        } else if (content.stopLossPrice) {
            content.stopLossAmount = null;
        } else {
            content.stopLossPrice = null;
            content.stopLossAmount = null;
        }
        if (content.takeProfitAmount) {
            content.takeProfitPrice = null;
        } else if (content.takeProfitPrice) {
            content.takeProfitAmount = null;
        } else {
            content.takeProfitPrice = null;
            content.takeProfitAmount = null;
        }
        // this.dispatch(showNotification({status: 'success',
        //     message: locales[getLanguageState(this.store.getState())].messages['umarket.changedDealSuccess']}));
        this.dispatch(changeOpenDealPlatformSuccess(content));
    }
}
