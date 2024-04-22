--file: projectschema2.sql
--name: Thomas van der Molen
--This file defines the sql schema that is used to construct the database
--This file also includes the insertion statements to populate the database

-- create users table
drop table if exists users;

create table users(
	username VARCHAR(40) primary key,
	password VARCHAR(64) NOT NULL,
	balance decimal(10,2),
	isExchange BOOLEAN
);

insert into users (username, password, balance, isExchange) values 
	('johnny123', '95d30169a59c418b52013315fc81bc99fdf0a7b03a116f346ab628496f349ed5', 10000, false),
	('ernie', '8a0151cbda82477895788d6023e567bb7ff8f7893b2aa83c16079f8d9bb92a58',     10000, false),
	('thomas', '18ef3d5708aa192eb98e6cb11964557171ef511531fdd412c5930867ffff752c',    10000, false),
	('warren', '32540fadef40c52354a7e6a2bf3b40b4a2e4bbaf2cb7c7a72c10a0723dc26756',    10000, false),
	('robert', '1d937cd89b8509c7590550654089de423c2e6efc03efc201283be67443194753',    10000, false),
	('NYSE',     '73f0211c6ba34865fd6c6b15575e647c695e26e9323dd935e8f73b2c414879ee', 0, true),
	('coinbase', 'f80f21938e5248ec70b870ac1103d0dd01b7811550a7a5c971e1c3e85ea62492', 0, true),
	('CME',      'e0671bd326867b636094a1eb1859a191365f916fda485c1c972642d1c1c32a9d', 0, true);
	

-- create exchanges table
drop table if exists listings;

create table listings(
	exchange VARCHAR(20),
	asset VARCHAR(20) primary key,
	CONSTRAINT fk_exchange FOREIGN KEY (exchange) REFERENCES users (username)
	ON DELETE CASCADE
);

insert into listings (exchange, asset) values
('NYSE', 'aapl'),
('NYSE', 'msft'),
('NYSE', 'nvda'),
('coinbase', 'btc'),
('coinbase', 'aave'),
('coinbase', 'eth'),
('coinbase', 'doge'),
('CME', 'gold'),
('CME', 'aaple-juice'),
('CME', 'soy'),
('CME', 'oil');

-- create portfolios table
drop table if exists portfolios;

create table portfolios(
	username VARCHAR(40),
	asset VARCHAR(20),
	quantity int,
	CONSTRAINT fk_uname FOREIGN KEY (username) REFERENCES users (username)
	ON DELETE CASCADE
	ON UPDATE CASCADE,
	CONSTRAINT fk_asset FOREIGN KEY (asset) REFERENCES listings (asset)
	ON DELETE CASCADE 
	ON UPDATE CASCADE
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
	low_price decimal(10,2),
	CONSTRAINT fk_stock_symbol FOREIGN KEY (symbol) REFERENCES listings (asset)
	ON DELETE CASCADE
);

insert into stocks (symbol, price, dividend, market_cap, high_price, low_price) values
('msft', 999.3, 0, 3426.99, 999.3, 121.5),
('nvda', 76.3, .5, 978.2, 315.5, 10.01),
('aapl', 100.1, .1, 1000.00, 106.9, 97.9);

-- create cryptocurrencies table
drop table if exists cryptocurrencies;

create table cryptocurrencies(
	symbol VARCHAR(5) primary key,
	price decimal(10,2),
	coin_type VARCHAR(3),
	market_cap decimal(10,2),
	high_price decimal(10,2),
	low_price decimal(10,2),
	CONSTRAINT fk_crypto_symbol FOREIGN KEY (symbol) REFERENCES listings (asset)
	ON DELETE CASCADE
);

insert into cryptocurrencies (symbol, price, coin_type, market_cap, high_price, low_price) values 
('btc', 100000, 'pow', 6.7, 65432.2, .56),
('eth', 675.00, 'pos', 2.1, 533.0, 461.0),
('doge', .56, 'pow', 0.7, 1.02, 0.01),
('aave', 12.67, 'pow', 1.1, 15.55, 5.94);

-- create commodities table
drop table if exists commodities;

create table commodities (
	name VARCHAR(20) primary key,
	price decimal(10,2),
	commodity_type VARCHAR(4),
	high_price decimal(10,2),
	low_price decimal(10,2),
	CONSTRAINT fk_name FOREIGN KEY (name) REFERENCES listings (asset)
	ON DELETE CASCADE
);

insert into commodities (name, price, commodity_type, high_price, low_price) values 
('oil', 8.67, 'hard', 5.30, 1.33),
('soy', 9.25, 'soft', 6.93, 1.5),
('gold', 867.53, 'hard', 86753.09, 8.67),
('aaple-juice', 0.10, 'soft', 5.00, 0.05);