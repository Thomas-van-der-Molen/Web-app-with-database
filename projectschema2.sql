
-- create exchanges table
drop table if exists listings;

create table listings(
	exchange VARCHAR(20),
	asset VARCHAR(20)
);

insert into listings (exchange, asset) values
('NYSE', 'aapl'),
('SSE', 'msft'),
('NASDAQ', 'nvda'),
('coinbase', 'btc'),
('cryptocom', 'eth'),
('binance', 'doge'),
('CME', 'gold'),
('TOCOM', 'soy'),
('CCX', 'oil');

-- create users table
drop table if exists users;

create table users(
	username VARCHAR(40) primary key,
	password VARCHAR(40) not null,
	balance decimal(10,2)
);

insert into users (username, password, balance) values 
	('johnny123', 'secretpassword', 0),
	('ernie', 'eagle123', 0),
	('thomas', 'worldsworstprogrammer', 0),
	('warren', 'oracleofomaha', 0),
	('robert', 'iloveinvesting', 0);
	
-- create portfolios table
drop table if exists portfolios;

create table portfolios(
	username VARCHAR(40),
	asset VARCHAR(30),
	quantity int
);

insert into portfolios (username, asset, quantity) values
('johnny123', 'btc', 100),
('johnny123', 'aapl', 10),
('johnny123', 'oil', 1),
('ernie', 'eth', 50),
('ernie', 'msft', 60),
('ernie', 'gold', 90),
('thomas', 'doge', 5),
('thomas', 'nvda', 3),
('thomas', 'soy', 11);

-- create stocks table
drop table if exists stocks;

create table stocks (
	symbol VARCHAR(5) primary key,
	price decimal(10,2),
	dividend decimal(10,2),
	market_cap decimal(10,2),
	high_price decimal(10,2),
	low_price decimal(10,2)
);

insert into stocks (symbol, price, dividend, market_cap, high_price, low_price) values
('msft', 999.3, 0, 3426.99, 999.3, 121.5),
('nvda', 76.3, .5, 978.2, 315.5, 10.01),
('aapl', 100.1, .1, 1000.00, 106.9, 97.9),
('tsla', 63.76, .9, 80.86, 73.31, 13.27),
('meta', 86.75, 0, 30.09, 1234.56, 7.89);

-- create cryptocurrencies table
drop table if exists cryptocurrencies;

create table cryptocurrencies(
	symbol VARCHAR(5) primary key,
	price decimal(10,2),
	coin_type VARCHAR(3),
	market_cap decimal(10,2),
	high_price decimal(10,2),
	low_price decimal(10,2)
);

insert into cryptocurrencies (symbol, price, coin_type, market_cap, high_price, low_price) values 
('btc', 100000, 'pow', 6.7, 65432.2, .56),
('eth', 675.00, 'pos', 2.1, 533.0, 461.0),
('doge', .56, 'pow', 0.7, 1.02, 0.01),
('ftm', 910.23, 'pos', 4567.89, 101112.13, 14.15),
('bnb', 167.18, 'pos', 1920.21, 2223.24, 25.26);

-- create commodities table
drop table if exists commodities;

create table commodities (
	name VARCHAR(20) primary key,
	price decimal(10,2),
	commodity_type VARCHAR(4),
	high_price decimal(10,2),
	low_price decimal(10,2)
);

insert into commodities (name, price, commodity_type, high_price, low_price) values 
('oil', 8.67, 'hard', 5.30, 1.33),
('soy', 9.25, 'soft', 6.93, 1.5),
('gold', 867.53, 'hard', 86753.09, 8.67),
('corn', 99.98, 'soft', 976.95, 9.43),
('gas', 87.86, 'hard', 858.40, 83.82);
