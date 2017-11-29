/**
* Funções base
*/
"function"!==typeof String.prototype.trim&&(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});
"function"!==typeof String.prototype.replaceSpecialChars&&(String.prototype.replaceSpecialChars=function(){var b={"\u00e7": "c","\u00e6": "ae","\u0153": "oe","\u00e1": "a","\u00e9": "e","\u00ed": "i","\u00f3": "o","\u00fa": "u","\u00e0": "a","\u00e8": "e","\u00ec": "i","\u00f2": "o","\u00f9": "u","\u00e4": "a","\u00eb": "e","\u00ef": "i","\u00f6": "o","\u00fc": "u","\u00ff": "y","\u00e2": "a","\u00ea": "e","\u00ee": "i","\u00f4": "o","\u00fb": "u","\u00e5": "a","\u00e3": "a","\u00f8": "o","\u00f5": "o",u: "u","\u00c1": "A","\u00c9": "E", "\u00cd": "I","\u00d3": "O","\u00da": "U","\u00ca": "E","\u00d4": "O","\u00dc": "U","\u00c3": "A","\u00d5": "O","\u00c0": "A","\u00c7": "C"};return this.replace(/[\u00e0-\u00fa]/ig,function(a){return"undefined"!=typeof b[a]?b[a]: a})});
Array.prototype.indexOf||(Array.prototype.indexOf=function(d,e){var a;if(null==this)throw new TypeError('"this" is null or not defined');var c=Object(this),b=c.length>>>0;if(0===b)return-1;a=+e||0;Infinity===Math.abs(a)&&(a=0);if(a>=b)return-1;for(a=Math.max(0<=a?a: b-Math.abs(a),0);a<b;){if(a in c&&c[a]===d)return a;a++}return-1});
function qd_number_format(b,c,d,e){b=(b+"").replace(/[^0-9+\-Ee.]/g,"");b=isFinite(+b)?+b:0;c=isFinite(+c)?Math.abs(c):0;e="undefined"===typeof e?",":e;d="undefined"===typeof d?".":d;var a="",a=function(a,b){var c=Math.pow(10,b);return""+(Math.round(a*c)/c).toFixed(b)},a=(c?a(b,c):""+Math.round(b)).split(".");3<a[0].length&&(a[0]=a[0].replace(/\B(?=(?:\d{3})+(?!\d))/g,e));(a[1]||"").length<c&&(a[1]=a[1]||"",a[1]+=Array(c-a[1].length+1).join("0"));return a.join(d)};

try {
	var Common = {
		run: function() {
			if(document.cookie.indexOf('x-qd-session-token') > -1)
				Common.sessionId = document.cookie.split('=')[
										document.cookie.split('=').indexOf('x-qd-session-token')+1
									].split(';')[0];
			else
				Common.sessionId = '';
			
			// 	Common._QD_ordersbyday_url = "http://localhost:8080/qd-dashboard/v2/api/chart/orders-by-day";
			// 	Common._QD_gettoken_url = "http://localhost:8080/qd-dashboard/v2/api/get-token";
			// 	Common._QD_validatetoken_url = "http://localhost:8080/qd-dashboard/v2/api/validate-token";
			// 	Common._QD_selectstore_url = "http://localhost:8080/qd-dashboard/v2/api/select-store";
			
				Common._QD_ordersbyday_url = "https://server.quatrodigital.com.br/qd-dashboard-api/chart/orders-by-day";
				Common._QD_gettoken_url = "https://server.quatrodigital.com.br/qd-dashboard-api/get-token";
				Common._QD_validatetoken_url = "https://server.quatrodigital.com.br/qd-dashboard-api/validate-token";
				Common._QD_selectstore_url = "https://server.quatrodigital.com.br/qd-dashboard-api/select-store";
		},
		init: function() {
			Common.getToken();
			Common.validateToken();
			Common.selectStore();
			Common.searchDates();
			Common.showChart();
		},
		ajaxStop: function() {},
		windowOnload: function() {},
		showChart: function() {
			dateStart = new Date();
			dateStart.setDate(1);
			dateEnd = new Date(dateStart);

			dateStart.setMonth(dateStart.getMonth() - 1);
			dateEnd.setDate(dateEnd.getDate() - 1);
			
			$('#dataInicial').val(dateStart.toISOString().split('T')[0]);
			$('#dataFinal').val(dateEnd.toISOString().split('T')[0]);

			Common.getDataChart(dateStart, dateEnd);
		},
		getDataChart: function(dateStart, dateEnd) {
			$('.qd-loading').show();

			$.ajax({
				url: Common._QD_ordersbyday_url,
				dataType: "json",
				headers: {
					'x-qd-session-token': Common.sessionId
				},
				data: {
					dateStart: dateStart.toISOString(),
					dateEnd: dateEnd.toISOString()
				}
			}).done(function(data) {
				$('.qd-loading').hide();
				if(data.Erro) {
					$('#modal-login').modal();
					return;
				}

				$('h2.loja').text(data.account);
				if(data.accounts.length > 1 && !$('select.page.accounts').length){
					select = $('<select>').addClass('form-control accounts page');
					for(i = 0; i < data.accounts.length; i++)
						select.append($('<option>').val(data.accounts[i]).text(data.accounts[i]));

					$('form.dates').parent().append(select.css({
						display: 'inline-block',
						width: 'auto',
						float: 'right'
					}).val(data.account));

					Common.changeStore();
				}

				if(data.data.length < 1) {
					$('.qd-loading').hide();
					alert('O período informado não retornou valores.');
					return;
				}
				
				Common.generateChart(data.data)
			});
		},
		generateChart: function(data) {
			var dates = ['day'];
			var ranks = ['rank'];
			var orders = ['orders'];
			var ordersMarketplace = ['ordersMarketplace'];
			var ordersIncompletes = ['ordersIncompletes'];
			var ga = ['ga'];
			var totalOrders = totalOrdersIncompletes = totalOrdersMarketplace = 0;

			keys = Object.keys(data);
			for(var day in data) {
				dates.push(day.split('/').reverse().join('-'));
				ranks.push(data[day].rank || null);
				orders.push(data[day].orders || null);
				ordersMarketplace.push(data[day].ordersMarketplace || null);
				ordersIncompletes.push(data[day].ordersIncompletes || null);
				ga.push(data[day].GA || null);

				totalOrders += parseInt(data[day].orders) || 0;
				totalOrdersIncompletes += parseInt(data[day].ordersMarketplace) || 0;
				// totalOrdersMarketplace += data[day].ordersIncompletes || 0;
			};

			var chart = c3.generate({
				bindto: '#chart',
				size: {
					height: 600
				},
				zoom: {
					enabled: true
				},
				data: {
					x: 'day',
					axes: {
						rank: 'y2',
					},
					columns: [
						orders,
						ordersIncompletes,
						ordersMarketplace,
						ga,
						ranks,
						dates
					],
					names : {
						orders: 'Pedidos da Loja',
						ordersIncompletes: 'Pedidos incompletos',
						ordersMarketplace: 'Pedidos via Marketplace',
						ga: 'GoogleAnalytics',
						rank: 'Ranking VTEX',
					},
					colors: {
						ordersIncompletes : '#9E9E9E',
						orders : '#81C784',
						ordersMarketplace : '#42A5F5',
						ga : '#F57C00',
						rank : '#DAA520'
					},
					type: 'bar',
					types: {
						rank: 'line'
					},
					groups: [
						['ordersMarketplace', 'orders', 'ordersIncompletes']
					],
					order: null
				},
				grid: {
					x: {
						show: true
					},
					y: {
						show: true
					}
				},
				legend: {
					position: 'inset',
					inset: {
						anchor: 'top-left',
						step: 1
					}
				},
				axis: {
					x: {
						type: 'timeseries',
						tick: {
							culling: false,
							rotate: 60,
							centered: true,
							format: '%d/%m/%Y'
						},
						label: {
							text: 'Data',
							position: 'outer-center'
						},
						height: 80,
					},
					y: {
						label: {
							text: 'Pedidos',
							position: 'outer-middle'
						}
					},
					y2: {
						show: true,
						inverted: true,
						label: {
							text: 'Rank',
							position: 'outer-middle'
						}
					}
				},
			});

			var chart2 = c3.generate({
				bindto: '#chart2',
				data: {
					columns: [
						orders,
						ordersIncompletes,
						ordersMarketplace
					],
					names : {
						orders: 'Pedidos da Loja',
						ordersIncompletes: 'Pedidos incompletos',
						ordersMarketplace: 'Pedidos via Marketplace'
					},
					colors: {
						ordersIncompletes : '#9E9E9E',
						orders : '#81C784',
						ordersMarketplace : '#42A5F5'
					},
					type : 'pie'
				},
				tooltip: {
					format: {
						value: function (value, ratio, id) {
							return value;
						}
					}
				}
			});

			// if(keys.length > 31)
			// 	chart.zoom([keys[0].split('/').reverse().join('-'), keys[30].split('/').reverse().join('-')]);

			$('.qd-loading').hide();
		},
		searchDates: function() {
			$('form.dates').on("submit", function(e) {
				e.preventDefault();

				var formData = $(this).serializeArray();
				dateStart = new Date(formData[0]['value']);
				dateEnd = new Date(formData[1]['value']);

				Common.getDataChart(dateStart, dateEnd);
			});
		},
		getToken: function() {
			$('#modal-login form').on('submit', function(e) {
				e.preventDefault();
				email = $(this).find('#email').val();
				btn = $(this).find('button');
				btn.button('loading');

				$.ajax({
					url: Common._QD_gettoken_url,
					dataType: "json",
					data: {
						email: email
					}
				}).done(function(data) {
					btn.button('reset');
					if(data.Erro) {
						$('#modal-login .form-group').append($('<span>').addClass('help-block').text(data.Erro)).addClass('has-error');
						return;
					}

					Common.sessionId = data['x-qd-session-token'];
					document.cookie = "x-qd-session-token=" + Common.sessionId;
					$('#modal-login').modal('hide');
					$('#modal-token').modal();
					return;
				});
			});
		},
		validateToken: function() {
			$('#modal-token form').on('submit', function(e) {
				e.preventDefault();
				token = $(this).find('#token').val();
				btn = $(this).find('button');
				btn.button('loading');

				$.ajax({
					url: Common._QD_validatetoken_url,
					dataType: "json",
					headers: {
						'x-qd-session-token': Common.sessionId
					},
					data: {
						token: token
					}
				}).done(function(data) {
					btn.button('reset');
					if(data.Erro) {
						$('#modal-token .form-group').append($('<span>').addClass('help-block').text(data.Erro)).addClass('has-error');
						return;
					}

					$('#modal-token').modal('hide');
					// Verifica se o usuário tem alguma conta
					if(!data.Accounts){
						$('#modal-login .form-group').append($('<span>').addClass('help-block').text('Esse usuário não possui nenhuma conta.')).addClass('has-error');
						$('#modal-login').modal();
						return;
					}
					
					// Verifica se o usuário possui mais de uma conta
					if(data.Accounts.length > 1){
						options = '';
						for(i = 0; i < data.Accounts.length; i++)
							$('#modal-lojas select.accounts').append($('<option>').val(data.Accounts[i]).text(data.Accounts[i]));

						$('#modal-lojas').modal();
						return;
					}

					Common.showChart();
					return;
				});
			});
		},
		selectStore: function() {
			$('#modal-lojas form').on('submit', function(e) {
				e.preventDefault();
				select = $(this).find('select');
				account = select.val();
				btn = $(this).find('button');
				btn.button('loading');

				$.ajax({
					url: Common._QD_selectstore_url,
					dataType: "json",
					headers: {
						'x-qd-session-token': Common.sessionId
					},
					data: {
						account: account
					}
				}).done(function(data) {
					btn.button('reset');
					if(data.Erro) {
						$('#modal-token .form-group').append($('<span>').addClass('help-block').text(data.Erro)).addClass('has-error');
						return;
					}

					$('#modal-lojas').modal('hide');
					Common.showChart();
					return;
				});
			});
		},
		changeStore: function() {
			$('select.accounts').on('change', function(e) {
				e.preventDefault();
				account = $(this).val();

				$.ajax({
					url: Common._QD_selectstore_url,
					dataType: "json",
					headers: {
						'x-qd-session-token': Common.sessionId
					},
					data: {
						account: account
					}
				}).done(function(data) {
					if(data.Erro) {
						alert(data.Erro);
						return;
					}

					Common.showChart();
					return;
				});
			});
		}
	}
}
catch (e) {(typeof console !== "undefined" && typeof console.error === "function" && console.error("Houve um erro nos objetos. Detalhes: " + e.message)); }

try {
	(function() {
		var body, ajaxStop, windowLoad;

		windowLoad = function() {
			Common.windowOnload();
		};

		ajaxStop = function() {
			Common.ajaxStop();
		};

		$(function() {
			body = $(document.body);
			Common.init();

			$(document).ajaxStop(ajaxStop);
			$(window).load(windowLoad);
			body.addClass('jsFullLoaded');
		});

		Common.run();
	})();
}
catch (e) {(typeof console !== "undefined" && typeof console.error === "function" && $(document.body).addClass('jsFullLoaded jsFullLoadedError') && console.error("Houve um erro ao iniciar os objetos. Detalhes: " + e.message)); }