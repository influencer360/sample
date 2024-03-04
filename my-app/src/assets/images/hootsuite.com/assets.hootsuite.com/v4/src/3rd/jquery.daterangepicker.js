/**
 * --------------------------------------------------------------------
 * jQuery-Plugin "daterangepicker.jQuery.js"
 * by Scott Jehl, scott@filamentgroup.com
 * http://www.filamentgroup.com
 * reference article: http://www.filamentgroup.com/lab/update_date_range_picker_with_jquery_ui/
 * demo page: http://www.filamentgroup.com/examples/daterangepicker/
 *
 * Copyright (c) 2008 Filament Group, Inc
 * Dual licensed under the MIT (filamentgroup.com/examples/mit-license.txt) and GPL (filamentgroup.com/examples/gpl-license.txt) licenses.
 *
 * Dependencies: jquery, jquery UI datepicker, date.js library (included at bottom), jQuery UI CSS Framework
 * Changelog:
 * 	10.23.2008 initial Version
 *  11.12.2008 changed dateFormat option to allow custom date formatting (credit: http://alexgoldstone.com/)
 *  01.04.09 updated markup to new jQuery UI CSS Framework
 *  01.19.2008 changed presets hash to support different text
 * --------------------------------------------------------------------
 */

(function() {

	var Date2 = Date;	// make things easier to edit for find/replace


jQuery.fn.daterangepicker = function(settings){
	var rangeInput = jQuery(this);

	//defaults
	var options = jQuery.extend({
		presetRanges: [
			//{text: 'Throwbot', dateStart: 'Apr 1, 2010', dateEnd: 'Apr 30, 2010' },
			{text: 'Today', dateStart: 'today', dateEnd: 'today' },
			{text: 'Last 7 days', dateStart: 'today-7days', dateEnd: 'today' },
			{text: 'Last 14 days', dateStart: 'today-14days', dateEnd: 'today' },
			{text: 'Month to date', dateStart: function(){ return Date2.newparse('today').moveToFirstDayOfMonth();  }, dateEnd: 'today' },
			//{text: 'Year to date', dateStart: function(){ var x= Date2.newparse('today'); x.setMonth(0); x.setDate(1); return x; }, dateEnd: 'today' },
			//extras:
			{text: 'Previous month ('+Date2.newparse('last month').toString("MMMM")+')', dateStart: function(){ return Date2.newparse('1 month ago').moveToFirstDayOfMonth();  }, dateEnd: function(){ return Date2.newparse('1 month ago').moveToLastDayOfMonth();  } }
			//{text: 'Tomorrow', dateStart: 'Tomorrow', dateEnd: 'Tomorrow' },
			//{text: 'Ad Campaign', dateStart: '03/07/08', dateEnd: 'Today' },
			//{text: 'Last 30 Days', dateStart: 'Today-30', dateEnd: 'Today' },
			//{text: 'Next 30 Days', dateStart: 'Today', dateEnd: 'Today+30' },
			//{text: 'Our Ad Campaign', dateStart: '03/07/08', dateEnd: '07/08/08' }
		],
		//presetRanges: array of objects for each menu preset.
		//Each obj must have text, dateStart, dateEnd. dateStart, dateEnd accept date.js string or a function which returns a date object
		presets: {
			specificDate: 'Specific Date',
			//allDatesBefore: 'All Dates Before',
			//allDatesAfter: 'All Dates After',
			dateRange: 'Date Range'
		},
		rangeStartTitle: 'Start date',
		rangeEndTitle: 'End date',
		nextLinkText: 'Next',
		prevLinkText: 'Prev',
		doneButtonText: 'Apply',
		validate: function (dateA, dateB) {
			return true;
		},
		earliestDate: Date2.newparse('-3years'), //earliest date allowed
		latestDate: Date2.newparse('today'), //latest date allowed
		rangeSplitter: '-', //string to use between dates in single input
		dateFormat: 'm/d/yy', // date formatting. Available formats: http://docs.jquery.com/UI/Datepicker/%24.datepicker.formatDate
		closeOnSelect: true, //if a complete selection is made, close the menu
		arrows: false,
		posX: rangeInput.offset().left, // x position
		posY: rangeInput.offset().top + rangeInput.outerHeight(), // y position
		appendTo: 'body',
		onClose: function(){},
		onOpen: function(){},
		onChange: function(){},
		datepickerOptions: {
			//object containing native UI datepicker API options\
		},
		isGMT: false
	}, settings);


	//custom datepicker options, extended by options
	var datepickerOptions = {
		onSelect: function() {
				var isValid = true;
				if(rp.find('.ui-daterangepicker-specificDate').is('.ui-state-active')){
					rp.find('.range-end').datepicker('setDate', rp.find('.range-start').datepicker('getDate') );
				}
				var rangeA = fDate( rp.find('.range-start').datepicker('getDate') );
				var rangeB = fDate( rp.find('.range-end').datepicker('getDate') );

				// check and validate ranges
				var today = new Date(),
					todayGmt = new Date(today.getTime() + (today.getTimezoneOffset() * 60 * 1000)),
					todayStamp = options.isGMT?todayGmt.getTime():(today.getTime()),		// if GMT, change to todayGmt.getTime()
					todayStr = options.isGMT?fDate(todayGmt):fDate(today),			// if GMT, change to fDate(todayGmt)
					rangeADate = Date2.newparse(rangeA),
					rangeBDate = Date2.newparse(rangeB),
					rangeAStamp = rangeADate.getTime(),
					rangeBStamp = rangeBDate.getTime();

                isValid = options.validate(rangeADate, rangeBDate);

				if (isValid) {
					//send back to input or inputs
					if(rangeInput.length == 2){
						rangeInput.eq(0).val(rangeA);
						rangeInput.eq(1).val(rangeB);
					}
					else{
						rangeInput.val((rangeA != rangeB) ? rangeA+' '+ options.rangeSplitter +' '+rangeB : rangeA);
					}

                    // Save dates as data attributes on the input(s)
                    rangeInput.data('rangeStart', rangeADate);
                    rangeInput.data('rangeEnd', rangeBDate);

					//if closeOnSelect is true
					if(options.closeOnSelect){
						if(!rp.find('li.ui-state-active').is('.ui-daterangepicker-dateRange') && !rp.is(':animated') ){
							hideRP();
						}
					}
					options.onChange();
				}

				// hack
				_.defer(function() {
					rp.find('.ui-state-highlight').removeClass('ui-state-highlight');
				});
			},
			defaultDate: +0
	};

	//change event fires both when a calendar is updated or a change event on the input is triggered
	rangeInput.change(options.onChange);


	//datepicker options from options
	options.datepickerOptions = (settings) ? jQuery.extend(datepickerOptions, settings.datepickerOptions) : datepickerOptions;

	//Capture Dates from input(s)
	var inputDateA, inputDateB = Date2.newparse('today');
	var inputDateAtemp, inputDateBtemp;
	if(rangeInput.size() == 2){
		inputDateAtemp = Date2.newparse( rangeInput.eq(0).val() );
		inputDateBtemp = Date2.newparse( rangeInput.eq(1).val() );
		if(inputDateAtemp == null){inputDateAtemp = inputDateBtemp;}
		if(inputDateBtemp == null){inputDateBtemp = inputDateAtemp;}
	}
	else {
		inputDateAtemp = Date2.newparse( rangeInput.val().split(options.rangeSplitter)[0] );
		inputDateBtemp = Date2.newparse( rangeInput.val().split(options.rangeSplitter)[1] );
		if(inputDateBtemp == null){inputDateBtemp = inputDateAtemp;} //if one date, set both
	}
	if(inputDateAtemp != null){inputDateA = inputDateAtemp;}
	if(inputDateBtemp != null){inputDateB = inputDateBtemp;}

	/*
	// convert inputDates to GTM
	inputDateA = new Date(inputDateA.getTime() + (inputDateA.getTimezoneOffset() * 60 * 1000));
	inputDateB = new Date(inputDateB.getTime() + (inputDateB.getTimezoneOffset() * 60 * 1000));
	*/

	//build picker and
	var rp = jQuery('<div class="ui-styles ui-daterangepicker ui-widget ui-helper-clearfix ui-widget-content ui-corner-all"></div>');
	var rpPresets = (function(){
		var ul = jQuery('<ul class="ui-widget-content"></ul>').appendTo(rp);
		jQuery.each(options.presetRanges,function(){
			jQuery('<li class="ui-daterangepicker-'+ this.text.replace(/ /g, '') +' ui-corner-all"><a href="#">'+ this.text +'</a></li>')
			.data('dateStart', this.dateStart)
			.data('dateEnd', this.dateEnd)
			.appendTo(ul);
		});
		var x=0;
		jQuery.each(options.presets, function(key, value) {
			jQuery('<li class="ui-daterangepicker-'+ key +' preset_'+ x +' ui-helper-clearfix ui-corner-all"><span class="ui-icon ui-icon-triangle-1-e"></span><a href="#">'+ value +'</a></li>')
			.appendTo(ul);
			x++;
		});

		ul.find('li').hover(
				function(){
					jQuery(this).addClass('ui-state-hover');
				},
				function(){
					jQuery(this).removeClass('ui-state-hover');
				})
			.click(function(){
				rp.find('.ui-state-active').removeClass('ui-state-active');
				jQuery(this).addClass('ui-state-active').clickActions(rp, rpPickers, doneBtn);
				return false;
			});
		return ul;
	})();

	//function to format a date string
	function fDate(date){
	   if(!date || !date.getDate()){return '';}
	   var day = date.getDate();
	   var month = date.getMonth();
	   var year = date.getFullYear();
	   month++; // adjust javascript month
	   var dateFormat = options.dateFormat;
	   return jQuery.datepicker.formatDate(dateFormat, date, {monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}); // monthNemesShort *mustn't* be translated
	}


	jQuery.fn.restoreDateFromData = function(){
		if(jQuery(this).data('saveDate')){
			jQuery(this).datepicker('setDate', jQuery(this).data('saveDate')).removeData('saveDate');
		}
		return this;
	}
	jQuery.fn.saveDateToData = function(){
		if(!jQuery(this).data('saveDate')){
			jQuery(this).data('saveDate', jQuery(this).datepicker('getDate') );
		}
		return this;
	}

	//show, hide, or toggle rangepicker
	function showRP(){
		if(rp.data('state') == 'closed'){
			rp.data('state', 'open');
			rp.fadeIn(300);
			options.onOpen();
		}
	}
	function hideRP(){
		if(rp.data('state') == 'open'){
			rp.data('state', 'closed');
			rp.fadeOut(300);
			options.onClose();
		}
	}
	function toggleRP(){
		if( rp.data('state') == 'open' ){ hideRP(); }
		else { showRP(); }
	}
	rp.data('state', 'closed');

	//preset menu click events
	jQuery.fn.clickActions = function(rp, rpPickers, doneBtn){
		if(jQuery(this).is('.ui-daterangepicker-specificDate')){
			doneBtn.hide();
			rpPickers.show();
			rp.find('.title-start').text( options.presets.specificDate );
			rp.find('.range-start').restoreDateFromData().show(400);
			rp.find('.range-end').restoreDateFromData().hide(400);
			setTimeout(function(){doneBtn.fadeIn();}, 400);
		}
		else if(jQuery(this).is('.ui-daterangepicker-allDatesBefore')){
			doneBtn.hide();
			rpPickers.show();
			rp.find('.title-end').text( options.presets.allDatesBefore );
			rp.find('.range-start').saveDateToData().datepicker('setDate', options.earliestDate).hide(400);
			rp.find('.range-end').restoreDateFromData().show(400);
			setTimeout(function(){doneBtn.fadeIn();}, 400);
		}
		else if(jQuery(this).is('.ui-daterangepicker-allDatesAfter')){
			doneBtn.hide();
			rpPickers.show();
			rp.find('.title-start').text( options.presets.allDatesAfter );
			rp.find('.range-start').restoreDateFromData().show(400);
			rp.find('.range-end').saveDateToData().datepicker('setDate', options.latestDate).hide(400);
			setTimeout(function(){doneBtn.fadeIn();}, 400);
		}
		else if(jQuery(this).is('.ui-daterangepicker-dateRange')){
			doneBtn.hide();
			rpPickers.show();
			rp.find('.title-start').text(options.rangeStartTitle);
			rp.find('.title-end').text(options.rangeEndTitle);
			rp.find('.range-start').restoreDateFromData().show(400);
			rp.find('.range-end').restoreDateFromData().show(400);
			setTimeout(function(){doneBtn.fadeIn();}, 400);
		}
		else {
			//custom date range
				doneBtn.hide();
				rp.find('.range-start, .range-end').hide(400, function(){
					rpPickers.hide();
				});
				var dateStart = (typeof jQuery(this).data('dateStart') == 'string') ? Date2.newparse(jQuery(this).data('dateStart')) : jQuery(this).data('dateStart')();
				var dateEnd = (typeof jQuery(this).data('dateEnd') == 'string') ? Date2.newparse(jQuery(this).data('dateEnd')) : jQuery(this).data('dateEnd')();

				var currentEndDate = Date2.newparse( fDate( rp.find('.range-end').datepicker('getDate') ) );

				//swap order of changing dates to prevent throwing an error message
                //also swap the order if the currentEndDate is in the future (timezone offset)
                if(dateStart > currentEndDate || currentEndDate > Date2.today()){
                    rp.find('.range-end').datepicker('setDate', dateEnd).find('.ui-datepicker-current-day').trigger('click');
                    rp.find('.range-start').datepicker('setDate', dateStart).find('.ui-datepicker-current-day').trigger('click');
                } else {
                    rp.find('.range-start').datepicker('setDate', dateStart).find('.ui-datepicker-current-day').trigger('click');
                    rp.find('.range-end').datepicker('setDate', dateEnd).find('.ui-datepicker-current-day').trigger('click');
                }
		}

		return false;
	}

	//picker divs
	var rpPickers = jQuery('<div class="ranges ui-widget-header ui-corner-all ui-helper-clearfix"><div class="range-start"><span class="title-start">Start Date</span></div><div class="range-end"><span class="title-end">End Date</span></div></div>').appendTo(rp);
	rpPickers.find('.range-start, .range-end').datepicker(options.datepickerOptions);
	rpPickers.find('.range-start').datepicker('setDate', inputDateA);
	rpPickers.find('.range-end').datepicker('setDate', inputDateB);
	var doneBtn = jQuery('<button class="btnDone ui-state-default ui-corner-all">'+ options.doneButtonText +'</button>')
	.click(function(){
		rp.find('.ui-datepicker-current-day').trigger('click');
		hideRP();
	})
	.hover(
			function(){
				jQuery(this).addClass('ui-state-hover');
			},
			function(){
				jQuery(this).removeClass('ui-state-hover');
			}
	)
	.appendTo(rpPickers);

	// @HACK: remove selected date since it doesn't work
	rpPickers.find('.ui-state-highlight').removeClass('ui-state-highlight');




	//inputs toggle rangepicker visibility
	jQuery(this).click(function(){
		toggleRP();
		return false;
	});
	//hide em all
	rpPickers.css('display', 'none').find('.range-start, .range-end, .btnDone').css('display', 'none');

	//inject rp
	jQuery(options.appendTo).append(rp);

	//wrap and position
	rp.wrap('<div class="ui-daterangepickercontain"></div>');
	/*
	if(options.posX){
		rp.parent().css('left', options.posX);
	}
	if(options.posY){
		rp.parent().css('top', options.posY);
	}
	*/

	//add arrows (only available on one input)
	if(options.arrows && rangeInput.size()==1){
		var prevLink = jQuery('<a href="#" class="ui-daterangepicker-prev ui-corner-all" title="'+ options.prevLinkText +'"><span class="ui-icon ui-icon-circle-triangle-w">'+ options.prevLinkText +'</span></a>');
		var nextLink = jQuery('<a href="#" class="ui-daterangepicker-next ui-corner-all" title="'+ options.nextLinkText +'"><span class="ui-icon ui-icon-circle-triangle-e">'+ options.nextLinkText +'</span></a>');
		jQuery(this)
		.addClass('ui-rangepicker-input ui-widget-content')
		.wrap('<div class="ui-daterangepicker-arrows ui-widget ui-widget-header ui-helper-clearfix ui-corner-all"></div>')
		.before( prevLink )
		.before( nextLink )
		.parent().find('a').click(function(){
			var dateA = rpPickers.find('.range-start').datepicker('getDate');
			var dateB = rpPickers.find('.range-end').datepicker('getDate');
			var diff = Math.abs( new TimeSpan(dateA - dateB).getTotalMilliseconds() ) + 86400000; //difference plus one day
			if(jQuery(this).is('.ui-daterangepicker-prev')){ diff = -diff; }

			rpPickers.find('.range-start, .range-end ').each(function(){
					var thisDate = jQuery(this).datepicker( "getDate");
					if(thisDate == null){return false;}
					jQuery(this).datepicker( "setDate", thisDate.add({milliseconds: diff}) ).find('.ui-datepicker-current-day').trigger('click');
			});

			return false;
		})
		.hover(
			function(){
				jQuery(this).addClass('ui-state-hover');
			},
			function(){
				jQuery(this).removeClass('ui-state-hover');
			})
		;
	}


	jQuery(document).click(function(){
		if (rp.is(':visible')) {
			hideRP();
		}
	});

	rp.click(function(){return false;}).hide();
	return this;
}



/**
 * Version: 1.0 Alpha-1
 * Build Date: 13-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/.
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */
Date2.CultureInfo =
{
	name: "en-US",
	englishName: "English (United States)",
	nativeName: "English (United States)",
	dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
	firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"],
	monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	amDesignator: "AM",
	pmDesignator: "PM",
	firstDayOfWeek: 0,
	twoDigitYearMax: 2029,
	dateElementOrder: "mdy",
	formatPatterns: {
		shortDate: "M/d/yyyy",
		longDate: "dddd, MMMM dd, yyyy",
		shortTime: "h:mm tt",
		longTime: "h:mm:ss tt",
		fullDateTime: "dddd, MMMM dd, yyyy h:mm:ss tt",
		sortableDateTime: "yyyy-MM-ddTHH:mm:ss",
		universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ",
		rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT",
		monthDay: "MMMM dd",
		yearMonth: "MMMM, yyyy"
	},
	regexPatterns: {
		jan: /^jan(uary)?/i,
		feb: /^feb(ruary)?/i,
		mar: /^mar(ch)?/i,
		apr: /^apr(il)?/i,
		may: /^may/i,
		jun: /^jun(e)?/i,
		jul: /^jul(y)?/i,
		aug: /^aug(ust)?/i,
		sep: /^sep(t(ember)?)?/i,
		oct: /^oct(ober)?/i,
		nov: /^nov(ember)?/i,
		dec: /^dec(ember)?/i,
		sun: /^su(n(day)?)?/i,
		mon: /^mo(n(day)?)?/i,
		tue: /^tu(e(s(day)?)?)?/i,
		wed: /^we(d(nesday)?)?/i,
		thu: /^th(u(r(s(day)?)?)?)?/i,
		fri: /^fr(i(day)?)?/i,
		sat: /^sa(t(urday)?)?/i,
		future: /^next/i,
		past: /^last|past|prev(ious)?/i,
		add: /^(\+|after|from)/i,
		subtract: /^(\-|before|ago)/i,
		yesterday: /^yesterday/i,
		today: /^t(oday)?/i,
		tomorrow: /^tomorrow/i,
		now: /^n(ow)?/i,
		millisecond: /^ms|milli(second)?s?/i,
		second: /^sec(ond)?s?/i,
		minute: /^min(ute)?s?/i,
		hour: /^h(ou)?rs?/i,
		week: /^w(ee)?k/i,
		month: /^m(o(nth)?s?)?/i,
		day: /^d(ays?)?/i,
		year: /^y((ea)?rs?)?/i,
		shortMeridian: /^(a|p)/i,
		longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i,
		timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt)/i,
		ordinalSuffix: /^\s*(st|nd|rd|th)/i,
		timeContext: /^\s*(\:|a|p)/i
	},
	abbreviatedTimeZoneStandard: {
		GMT: "-000",
		EST: "-0400",
		CST: "-0500",
		MST: "-0600",
		PST: "-0700"
	},
	abbreviatedTimeZoneDST: {
		GMT: "-000",
		EDT: "-0500",
		CDT: "-0600",
		MDT: "-0700",
		PDT: "-0800"
	}
};
Date2.getMonthNumberFromName = function (name)
{
	var n = Date2.CultureInfo.monthNames,
		m = Date2.CultureInfo.abbreviatedMonthNames,
		s = name.toLowerCase();
	for (var i = 0; i < n.length; i++)
	{
		if (n[i].toLowerCase() == s || m[i].toLowerCase() == s)
		{
			return i;
		}
	}
	return -1;
};
Date2.getDayNumberFromName = function (name)
{
	var n = Date2.CultureInfo.dayNames,
		m = Date2.CultureInfo.abbreviatedDayNames,
		o = Date2.CultureInfo.shortestDayNames,
		s = name.toLowerCase();
	for (var i = 0; i < n.length; i++)
	{
		if (n[i].toLowerCase() == s || m[i].toLowerCase() == s)
		{
			return i;
		}
	}
	return -1;
};
Date2.isLeapYear = function (year)
{
	return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
};
Date2.getDaysInMonth = function (year, month)
{
	return [31, (Date2.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};
Date2.getTimezoneOffset = function (s, dst)
{
	return (dst || false) ? Date2.CultureInfo.abbreviatedTimeZoneDST[s.toUpperCase()] : Date2.CultureInfo.abbreviatedTimeZoneStandard[s.toUpperCase()];
};
Date2.getTimezoneAbbreviation = function (offset, dst)
{
	var n = (dst || false) ? Date2.CultureInfo.abbreviatedTimeZoneDST : Date2.CultureInfo.abbreviatedTimeZoneStandard,
		p;
	for (p in n)
	{
		if (n[p] === offset)
		{
			return p;
		}
	}
	return null;
};
Date2.prototype.clone = function ()
{
	return new Date2(this.getTime());
};
Date2.prototype.compareTo = function (date)
{
	if (isNaN(this))
	{
		throw new Error(this);
	}
	if (date instanceof Date && !isNaN(date))
	{
		return (this > date) ? 1 : (this < date) ? -1 : 0;
	}
	else
	{
		throw new TypeError(date);
	}
};
Date2.prototype.equals = function (date)
{
	return (this.compareTo(date) === 0);
};
Date2.prototype.between = function (start, end)
{
	var t = this.getTime();
	return t >= start.getTime() && t <= end.getTime();
};
Date2.prototype.addMilliseconds = function (value)
{
	this.setMilliseconds(this.getMilliseconds() + value);
	return this;
};
Date2.prototype.addSeconds = function (value)
{
	return this.addMilliseconds(value * 1000);
};
Date2.prototype.addMinutes = function (value)
{
	return this.addMilliseconds(value * 60000);
};
Date2.prototype.addHours = function (value)
{
	return this.addMilliseconds(value * 3600000);
};
Date2.prototype.addDays = function (value)
{
	return this.addMilliseconds(value * 86400000);
};
Date2.prototype.addWeeks = function (value)
{
	return this.addMilliseconds(value * 604800000);
};
Date2.prototype.addMonths = function (value)
{
	var n = this.getDate();
	this.setDate(1);
	this.setMonth(this.getMonth() + value);
	this.setDate(Math.min(n, this.getDaysInMonth()));
	return this;
};
Date2.prototype.addYears = function (value)
{
	return this.addMonths(value * 12);
};
Date2.prototype.add = function (config)
{
	if (typeof config == "number")
	{
		this._orient = config;
		return this;
	}
	var x = config;
	if (x.millisecond || x.milliseconds)
	{
		this.addMilliseconds(x.millisecond || x.milliseconds);
	}
	if (x.second || x.seconds)
	{
		this.addSeconds(x.second || x.seconds);
	}
	if (x.minute || x.minutes)
	{
		this.addMinutes(x.minute || x.minutes);
	}
	if (x.hour || x.hours)
	{
		this.addHours(x.hour || x.hours);
	}
	if (x.month || x.months)
	{
		this.addMonths(x.month || x.months);
	}
	if (x.year || x.years)
	{
		this.addYears(x.year || x.years);
	}
	if (x.day || x.days)
	{
		this.addDays(x.day || x.days);
	}
	return this;
};
Date2._validate = function (value, min, max, name)
{
	if (typeof value != "number")
	{
		throw new TypeError(value + " is not a Number.");
	}
	else if (value < min || value > max)
	{
		throw new RangeError(value + " is not a valid value for " + name + ".");
	}
	return true;
};
Date2.validateMillisecond = function (n)
{
	return Date2._validate(n, 0, 999, "milliseconds");
};
Date2.validateSecond = function (n)
{
	return Date2._validate(n, 0, 59, "seconds");
};
Date2.validateMinute = function (n)
{
	return Date2._validate(n, 0, 59, "minutes");
};
Date2.validateHour = function (n)
{
	return Date2._validate(n, 0, 23, "hours");
};
Date2.validateDay = function (n, year, month)
{
	return Date2._validate(n, 1, Date2.getDaysInMonth(year, month), "days");
};
Date2.validateMonth = function (n)
{
	return Date2._validate(n, 0, 11, "months");
};
Date2.validateYear = function (n)
{
	return Date2._validate(n, 1, 9999, "seconds");
};
Date2.prototype.set = function (config)
{
	var x = config;
	if (!x.millisecond && x.millisecond !== 0)
	{
		x.millisecond = -1;
	}
	if (!x.second && x.second !== 0)
	{
		x.second = -1;
	}
	if (!x.minute && x.minute !== 0)
	{
		x.minute = -1;
	}
	if (!x.hour && x.hour !== 0)
	{
		x.hour = -1;
	}
	if (!x.day && x.day !== 0)
	{
		x.day = -1;
	}
	if (!x.month && x.month !== 0)
	{
		x.month = -1;
	}
	if (!x.year && x.year !== 0)
	{
		x.year = -1;
	}
	if (x.millisecond != -1 && Date2.validateMillisecond(x.millisecond))
	{
		this.addMilliseconds(x.millisecond - this.getMilliseconds());
	}
	if (x.second != -1 && Date2.validateSecond(x.second))
	{
		this.addSeconds(x.second - this.getSeconds());
	}
	if (x.minute != -1 && Date2.validateMinute(x.minute))
	{
		this.addMinutes(x.minute - this.getMinutes());
	}
	if (x.hour != -1 && Date2.validateHour(x.hour))
	{
		this.addHours(x.hour - this.getHours());
	}
	if (x.month !== -1 && Date2.validateMonth(x.month))
	{
		this.addMonths(x.month - this.getMonth());
	}
	if (x.year != -1 && Date2.validateYear(x.year))
	{
		this.addYears(x.year - this.getFullYear());
	}
	if (x.day != -1 && Date2.validateDay(x.day, this.getFullYear(), this.getMonth()))
	{
		this.addDays(x.day - this.getDate());
	}
	if (x.timezone)
	{
		this.setTimezone(x.timezone);
	}
	if (x.timezoneOffset)
	{
		this.setTimezoneOffset(x.timezoneOffset);
	}
	return this;
};
Date2.prototype.clearTime = function ()
{
	this.setHours(0);
	this.setMinutes(0);
	this.setSeconds(0);
	this.setMilliseconds(0);
	return this;
};
Date2.prototype.isLeapYear = function ()
{
	var y = this.getFullYear();
	return (((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0));
};
Date2.prototype.isWeekday = function ()
{
	return !(this.is().sat() || this.is().sun());
};
Date2.prototype.getDaysInMonth = function ()
{
	return Date2.getDaysInMonth(this.getFullYear(), this.getMonth());
};
Date2.prototype.moveToFirstDayOfMonth = function ()
{
	return this.set(
	{
		day: 1
	});
};
Date2.prototype.moveToLastDayOfMonth = function ()
{
	return this.set(
	{
		day: this.getDaysInMonth()
	});
};
Date2.prototype.moveToDayOfWeek = function (day, orient)
{
	var diff = (day - this.getDay() + 7 * (orient || +1)) % 7;
	return this.addDays((diff === 0) ? diff += 7 * (orient || +1) : diff);
};
Date2.prototype.moveToMonth = function (month, orient)
{
	var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12;
	return this.addMonths((diff === 0) ? diff += 12 * (orient || +1) : diff);
};
Date2.prototype.getDayOfYear = function ()
{
	return Math.floor((this - new Date2(this.getFullYear(), 0, 1)) / 86400000);
};
Date2.prototype.getWeekOfYear = function (firstDayOfWeek)
{
	var y = this.getFullYear(),
		m = this.getMonth(),
		d = this.getDate();
	var dow = firstDayOfWeek || Date2.CultureInfo.firstDayOfWeek;
	var offset = 7 + 1 - new Date2(y, 0, 1).getDay();
	if (offset == 8)
	{
		offset = 1;
	}
	var daynum = ((Date2.UTC(y, m, d, 0, 0, 0) - Date2.UTC(y, 0, 1, 0, 0, 0)) / 86400000) + 1;
	var w = Math.floor((daynum - offset + 7) / 7);
	if (w === dow)
	{
		y--;
		var prevOffset = 7 + 1 - new Date2(y, 0, 1).getDay();
		if (prevOffset == 2 || prevOffset == 8)
		{
			w = 53;
		}
		else
		{
			w = 52;
		}
	}
	return w;
};
Date2.prototype.isDST = function ()
{
	return this.toString().match(/(E|C|M|P)(S|D)T/)[2] == "D";
};
Date2.prototype.getTimezone = function ()
{
	return Date2.getTimezoneAbbreviation(this.getUTCOffset, this.isDST());
};
Date2.prototype.setTimezoneOffset = function (s)
{
	var here = this.getTimezoneOffset(),
		there = Number(s) * -6 / 10;
	this.addMinutes(there - here);
	return this;
};
Date2.prototype.setTimezone = function (s)
{
	return this.setTimezoneOffset(Date2.getTimezoneOffset(s));
};
Date2.prototype.getUTCOffset = function ()
{
	var n = this.getTimezoneOffset() * -10 / 6,
		r;
	if (n < 0)
	{
		r = (n - 10000).toString();
		return r[0] + r.substr(2);
	}
	else
	{
		r = (n + 10000).toString();
		return "+" + r.substr(1);
	}
};
Date2.prototype.getDayName = function (abbrev)
{
	return abbrev ? Date2.CultureInfo.abbreviatedDayNames[this.getDay()] : Date2.CultureInfo.dayNames[this.getDay()];
};
Date2.prototype.getMonthName = function (abbrev)
{
	return abbrev ? Date2.CultureInfo.abbreviatedMonthNames[this.getMonth()] : Date2.CultureInfo.monthNames[this.getMonth()];
};
Date2.prototype._toString = Date2.prototype.toString;
Date2.prototype.toString = function (format)
{
	var self = this;
	var p = function p(s)
	{
		return (s.toString().length == 1) ? "0" + s : s;
	};
	return format ? format.replace(/dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?/g, function (format)
	{
		switch (format)
		{
		case "hh":
			return p(self.getHours() < 13 ? self.getHours() : (self.getHours() - 12));
		case "h":
			return self.getHours() < 13 ? self.getHours() : (self.getHours() - 12);
		case "HH":
			return p(self.getHours());
		case "H":
			return self.getHours();
		case "mm":
			return p(self.getMinutes());
		case "m":
			return self.getMinutes();
		case "ss":
			return p(self.getSeconds());
		case "s":
			return self.getSeconds();
		case "yyyy":
			return self.getFullYear();
		case "yy":
			return self.getFullYear().toString().substring(2, 4);
		case "dddd":
			return self.getDayName();
		case "ddd":
			return self.getDayName(true);
		case "dd":
			return p(self.getDate());
		case "d":
			return self.getDate().toString();
		case "MMMM":
			return self.getMonthName();
		case "MMM":
			return self.getMonthName(true);
		case "MM":
			return p((self.getMonth() + 1));
		case "M":
			return self.getMonth() + 1;
		case "t":
			return self.getHours() < 12 ? Date2.CultureInfo.amDesignator.substring(0, 1) : Date2.CultureInfo.pmDesignator.substring(0, 1);
		case "tt":
			return self.getHours() < 12 ? Date2.CultureInfo.amDesignator : Date2.CultureInfo.pmDesignator;
		case "zzz":
		case "zz":
		case "z":
			return "";
		}
	}) : this._toString();
};
Date2.today = function ()
{
	return (new Date2()).clearTime();
};
Date2.prototype._orient = +1;
Date2.prototype.next = function ()
{
	this._orient = +1;
	return this;
};
Date2.prototype.last = Date2.prototype.prev = Date2.prototype.previous = function ()
{
	this._orient = -1;
	return this;
};
Date2.prototype._is = false;
Date2.prototype.is = function ()
{
	this._is = true;
	return this;
};
Number.prototype._dateElement = "day";
Number.prototype.fromNow = function ()
{
	var c =
	{
	};
	c[this._dateElement] = this;
	return (new Date2()).add(c);
};
Number.prototype.ago = function ()
{
	var c =
	{
	};
	c[this._dateElement] = this * -1;
	return (new Date2()).add(c);
};
(function ()
{
	var $D = Date2.prototype,
		$N = Number.prototype;
	var dx = ("sunday monday tuesday wednesday thursday friday saturday").split(/\s/),
		mx = ("january february march april may june july august september october november december").split(/\s/),
		px = ("Millisecond Second Minute Hour Day Week Month Year").split(/\s/),
		de;
	var df = function (n)
	{
		return function ()
		{
			if (this._is)
			{
				this._is = false;
				return this.getDay() == n;
			}
			return this.moveToDayOfWeek(n, this._orient);
		};
	};
	for (var i = 0; i < dx.length; i++)
	{
		$D[dx[i]] = $D[dx[i].substring(0, 3)] = df(i);
	}
	var mf = function (n)
	{
		return function ()
		{
			if (this._is)
			{
				this._is = false;
				return this.getMonth() === n;
			}
			return this.moveToMonth(n, this._orient);
		};
	};
	for (var j = 0; j < mx.length; j++)
	{
		$D[mx[j]] = $D[mx[j].substring(0, 3)] = mf(j);
	}
	var ef = function (j)
	{
		return function ()
		{
			if (j.substring(j.length - 1) != "s")
			{
				j += "s";
			}
			return this["add" + j](this._orient);
		};
	};
	var nf = function (n)
	{
		return function ()
		{
			this._dateElement = n;
			return this;
		};
	};
	for (var k = 0; k < px.length; k++)
	{
		de = px[k].toLowerCase();
		$D[de] = $D[de + "s"] = ef(px[k]);
		$N[de] = $N[de + "s"] = nf(de);
	}
}());
Date2.prototype.toJSONString = function ()
{
	return this.toString("yyyy-MM-ddThh:mm:ssZ");
};
Date2.prototype.toShortDateString = function ()
{
	return this.toString(Date2.CultureInfo.formatPatterns.shortDatePattern);
};
Date2.prototype.toLongDateString = function ()
{
	return this.toString(Date2.CultureInfo.formatPatterns.longDatePattern);
};
Date2.prototype.toShortTimeString = function ()
{
	return this.toString(Date2.CultureInfo.formatPatterns.shortTimePattern);
};
Date2.prototype.toLongTimeString = function ()
{
	return this.toString(Date2.CultureInfo.formatPatterns.longTimePattern);
};
Date2.prototype.getOrdinal = function ()
{
	switch (this.getDate())
	{
	case 1:
	case 21:
	case 31:
		return "st";
	case 2:
	case 22:
		return "nd";
	case 3:
	case 23:
		return "rd";
	default:
		return "th";
	}
};
(function ()
{
	Date2.Parsing =
	{
		Exception: function (s)
		{
			this.message = "Parse error at '" + s.substring(0, 10) + " ...'";
		}
	};
	var $P = Date2.Parsing;
	var _ = $P.Operators =
	{
		rtoken: function (r)
		{
			return function (s)
			{
				var mx = s.match(r);
				if (mx)
				{
					return ([mx[0], s.substring(mx[0].length)]);
				}
				else
				{
					throw new $P.Exception(s);
				}
			};
		},
		token: function (s)
		{
			return function (s)
			{
				return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s);
			};
		},
		stoken: function (s)
		{
			return _.rtoken(new RegExp("^" + s));
		},
		until: function (p)
		{
			return function (s)
			{
				var qx = [],
					rx = null;
				while (s.length)
				{
					try
					{
						rx = p.call(this, s);
					}
					catch (e)
					{
						qx.push(rx[0]);
						s = rx[1];
						continue;
					}
					break;
				}
				return [qx, s];
			};
		},
		many: function (p)
		{
			return function (s)
			{
				var rx = [],
					r = null;
				while (s.length)
				{
					try
					{
						r = p.call(this, s);
					}
					catch (e)
					{
						return [rx, s];
					}
					rx.push(r[0]);
					s = r[1];
				}
				return [rx, s];
			};
		},
		optional: function (p)
		{
			return function (s)
			{
				var r = null;
				try
				{
					r = p.call(this, s);
				}
				catch (e)
				{
					return [null, s];
				}
				return [r[0], r[1]];
			};
		},
		not: function (p)
		{
			return function (s)
			{
				try
				{
					p.call(this, s);
				}
				catch (e)
				{
					return [null, s];
				}
				throw new $P.Exception(s);
			};
		},
		ignore: function (p)
		{
			return p ?
			function (s)
			{
				var r = null;
				r = p.call(this, s);
				return [null, r[1]];
			} : null;
		},
		product: function ()
		{
			var px = arguments[0],
				qx = Array.prototype.slice.call(arguments, 1),
				rx = [];
			for (var i = 0; i < px.length; i++)
			{
				rx.push(_.each(px[i], qx));
			}
			return rx;
		},
		cache: function (rule)
		{
			var cache =
			{
			},
				r = null;
			return function (s)
			{
				try
				{
					r = cache[s] = (cache[s] || rule.call(this, s));
				}
				catch (e)
				{
					r = cache[s] = e;
				}
				if (r instanceof $P.Exception)
				{
					throw r;
				}
				else
				{
					return r;
				}
			};
		},
		any: function ()
		{
			var px = arguments;
			return function (s)
			{
				var r = null;
				for (var i = 0; i < px.length; i++)
				{
					if (px[i] == null)
					{
						continue;
					}
					try
					{
						r = (px[i].call(this, s));
					}
					catch (e)
					{
						r = null;
					}
					if (r)
					{
						return r;
					}
				}
				throw new $P.Exception(s);
			};
		},
		each: function ()
		{
			var px = arguments;
			return function (s)
			{
				var rx = [],
					r = null;
				for (var i = 0; i < px.length; i++)
				{
					if (px[i] == null)
					{
						continue;
					}
					try
					{
						r = (px[i].call(this, s));
					}
					catch (e)
					{
						throw new $P.Exception(s);
					}
					rx.push(r[0]);
					s = r[1];
				}
				return [rx, s];
			};
		},
		all: function ()
		{
			var px = arguments,
				_ = _;
			return _.each(_.optional(px));
		},
		sequence: function (px, d, c)
		{
			d = d || _.rtoken(/^\s*/);
			c = c || null;
			if (px.length == 1)
			{
				return px[0];
			}
			return function (s)
			{
				var r = null,
					q = null;
				var rx = [];
				for (var i = 0; i < px.length; i++)
				{
					try
					{
						r = px[i].call(this, s);
					}
					catch (e)
					{
						break;
					}
					rx.push(r[0]);
					try
					{
						q = d.call(this, r[1]);
					}
					catch (ex)
					{
						q = null;
						break;
					}
					s = q[1];
				}
				if (!r)
				{
					throw new $P.Exception(s);
				}
				if (q)
				{
					throw new $P.Exception(q[1]);
				}
				if (c)
				{
					try
					{
						r = c.call(this, r[1]);
					}
					catch (ey)
					{
						throw new $P.Exception(r[1]);
					}
				}
				return [rx, (r ? r[1] : s)];
			};
		},
		between: function (d1, p, d2)
		{
			d2 = d2 || d1;
			var _fn = _.each(_.ignore(d1), p, _.ignore(d2));
			return function (s)
			{
				var rx = _fn.call(this, s);
				return [[rx[0][0], r[0][2]], rx[1]];
			};
		},
		list: function (p, d, c)
		{
			d = d || _.rtoken(/^\s*/);
			c = c || null;
			return (p instanceof Array ? _.each(_.product(p.slice(0, -1), _.ignore(d)), p.slice(-1), _.ignore(c)) : _.each(_.many(_.each(p, _.ignore(d))), px, _.ignore(c)));
		},
		set: function (px, d, c)
		{
			d = d || _.rtoken(/^\s*/);
			c = c || null;
			return function (s)
			{
				var r = null,
					p = null,
					q = null,
					rx = null,
					best = [
						[], s],
					last = false;
				for (var i = 0; i < px.length; i++)
				{
					q = null;
					p = null;
					r = null;
					last = (px.length == 1);
					try
					{
						r = px[i].call(this, s);
					}
					catch (e)
					{
						continue;
					}
					rx = [
						[r[0]], r[1]
					];
					if (r[1].length > 0 && !last)
					{
						try
						{
							q = d.call(this, r[1]);
						}
						catch (ex)
						{
							last = true;
						}
					}
					else
					{
						last = true;
					}
					if (!last && q[1].length === 0)
					{
						last = true;
					}
					if (!last)
					{
						var qx = [];
						for (var j = 0; j < px.length; j++)
						{
							if (i != j)
							{
								qx.push(px[j]);
							}
						}
						p = _.set(qx, d).call(this, q[1]);
						if (p[0].length > 0)
						{
							rx[0] = rx[0].concat(p[0]);
							rx[1] = p[1];
						}
					}
					if (rx[1].length < best[1].length)
					{
						best = rx;
					}
					if (best[1].length === 0)
					{
						break;
					}
				}
				if (best[0].length === 0)
				{
					return best;
				}
				if (c)
				{
					try
					{
						q = c.call(this, best[1]);
					}
					catch (ey)
					{
						throw new $P.Exception(best[1]);
					}
					best[1] = q[1];
				}
				return best;
			};
		},
		forward: function (gr, fname)
		{
			return function (s)
			{
				return gr[fname].call(this, s);
			};
		},
		replace: function (rule, repl)
		{
			return function (s)
			{
				var r = rule.call(this, s);
				return [repl, r[1]];
			};
		},
		process: function (rule, fn)
		{
			return function (s)
			{
				var r = rule.call(this, s);
				return [fn.call(this, r[0]), r[1]];
			};
		},
		min: function (min, rule)
		{
			return function (s)
			{
				var rx = rule.call(this, s);
				if (rx[0].length < min)
				{
					throw new $P.Exception(s);
				}
				return rx;
			};
		}
	};
	var _generator = function (op)
	{
		return function ()
		{
			var args = null,
				rx = [];
			if (arguments.length > 1)
			{
				args = Array.prototype.slice.call(arguments);
			}
			else if (arguments[0] instanceof Array)
			{
				args = arguments[0];
			}
			if (args)
			{
				for (var i = 0, px = args.shift(); i < px.length; i++)
				{
					args.unshift(px[i]);
					rx.push(op.apply(null, args));
					args.shift();
					return rx;
				}
			}
			else
			{
				return op.apply(null, arguments);
			}
		};
	};
	var gx = "optional not ignore cache".split(/\s/);
	for (var i = 0; i < gx.length; i++)
	{
		_[gx[i]] = _generator(_[gx[i]]);
	}
	var _vector = function (op)
	{
		return function ()
		{
			if (arguments[0] instanceof Array)
			{
				return op.apply(null, arguments[0]);
			}
			else
			{
				return op.apply(null, arguments);
			}
		};
	};
	var vx = "each any all".split(/\s/);
	for (var j = 0; j < vx.length; j++)
	{
		_[vx[j]] = _vector(_[vx[j]]);
	}
}());
(function ()
{
	var flattenAndCompact = function (ax)
	{
		var rx = [];
		for (var i = 0; i < ax.length; i++)
		{
			if (ax[i] instanceof Array)
			{
				rx = rx.concat(flattenAndCompact(ax[i]));
			}
			else
			{
				if (ax[i])
				{
					rx.push(ax[i]);
				}
			}
		}
		return rx;
	};
	Date2.Grammar =
	{
	};
	Date2.Translator =
	{
		hour: function (s)
		{
			return function ()
			{
				this.hour = Number(s);
			};
		},
		minute: function (s)
		{
			return function ()
			{
				this.minute = Number(s);
			};
		},
		second: function (s)
		{
			return function ()
			{
				this.second = Number(s);
			};
		},
		meridian: function (s)
		{
			return function ()
			{
				this.meridian = s.slice(0, 1).toLowerCase();
			};
		},
		timezone: function (s)
		{
			return function ()
			{
				var n = s.replace(/[^\d\+\-]/g, "");
				if (n.length)
				{
					this.timezoneOffset = Number(n);
				}
				else
				{
					this.timezone = s.toLowerCase();
				}
			};
		},
		day: function (x)
		{
			var s = x[0];
			return function ()
			{
				this.day = Number(s.match(/\d+/)[0]);
			};
		},
		month: function (s)
		{
			return function ()
			{
				this.month = ((s.length == 3) ? Date2.getMonthNumberFromName(s) : (Number(s) - 1));
			};
		},
		year: function (s)
		{
			return function ()
			{
				var n = Number(s);
				this.year = ((s.length > 2) ? n : (n + (((n + 2000) < Date2.CultureInfo.twoDigitYearMax) ? 2000 : 1900)));
			};
		},
		rday: function (s)
		{
			return function ()
			{
				switch (s)
				{
				case "yesterday":
					this.days = -1;
					break;
				case "tomorrow":
					this.days = 1;
					break;
				case "today":
					this.days = 0;
					break;
				case "now":
					this.days = 0;
					this.now = true;
					break;
				}
			};
		},
		finishExact: function (x)
		{
			x = (x instanceof Array) ? x : [x];
			var now = new Date2();
			this.year = now.getFullYear();
			this.month = now.getMonth();
			this.day = 1;
			this.hour = 0;
			this.minute = 0;
			this.second = 0;
			for (var i = 0; i < x.length; i++)
			{
				if (x[i])
				{
					x[i].call(this);
				}
			}
			this.hour = (this.meridian == "p" && this.hour < 13) ? this.hour + 12 : this.hour;
			if (this.day > Date2.getDaysInMonth(this.year, this.month))
			{
				throw new RangeError(this.day + " is not a valid value for days.");
			}
			var r = new Date2(this.year, this.month, this.day, this.hour, this.minute, this.second);
			if (this.timezone)
			{
				r.set(
				{
					timezone: this.timezone
				});
			}
			else if (this.timezoneOffset)
			{
				r.set(
				{
					timezoneOffset: this.timezoneOffset
				});
			}
			return r;
		},
		finish: function (x)
		{
			x = (x instanceof Array) ? flattenAndCompact(x) : [x];
			if (x.length === 0)
			{
				return null;
			}
			for (var i = 0; i < x.length; i++)
			{
				if (typeof x[i] == "function")
				{
					x[i].call(this);
				}
			}
			if (this.now)
			{
				return new Date2();
			}
			var today = Date2.today();
			var method = null;
			var expression = !! (this.days != null || this.orient || this.operator);
			if (expression)
			{
				var gap, mod, orient;
				orient = ((this.orient == "past" || this.operator == "subtract") ? -1 : 1);
				if (this.weekday)
				{
					this.unit = "day";
					gap = (Date2.getDayNumberFromName(this.weekday) - today.getDay());
					mod = 7;
					this.days = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
				}
				if (this.month)
				{
					this.unit = "month";
					gap = (this.month - today.getMonth());
					mod = 12;
					this.months = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
					this.month = null;
				}
				if (!this.unit)
				{
					this.unit = "day";
				}
				if (this[this.unit + "s"] == null || this.operator != null)
				{
					if (!this.value)
					{
						this.value = 1;
					}
					if (this.unit == "week")
					{
						this.unit = "day";
						this.value = this.value * 7;
					}
					this[this.unit + "s"] = this.value * orient;
				}
				return today.add(this);
			}
			else
			{
				if (this.meridian && this.hour)
				{
					this.hour = (this.hour < 13 && this.meridian == "p") ? this.hour + 12 : this.hour;
				}
				if (this.weekday && !this.day)
				{
					this.day = (today.addDays((Date2.getDayNumberFromName(this.weekday) - today.getDay()))).getDate();
				}
				if (this.month && !this.day)
				{
					this.day = 1;
				}
				return today.set(this);
			}
		}
	};
	var _ = Date2.Parsing.Operators,
		g = Date2.Grammar,
		t = Date2.Translator,
		_fn;
	g.datePartDelimiter = _.rtoken(/^([\s\-\.\,\/\x27]+)/);
	g.timePartDelimiter = _.stoken(":");
	g.whiteSpace = _.rtoken(/^\s*/);
	g.generalDelimiter = _.rtoken(/^(([\s\,]|at|on)+)/);
	var _C =
	{
	};
	g.ctoken = function (keys)
	{
		var fn = _C[keys];
		if (!fn)
		{
			var c = Date2.CultureInfo.regexPatterns;
			var kx = keys.split(/\s+/),
				px = [];
			for (var i = 0; i < kx.length; i++)
			{
				px.push(_.replace(_.rtoken(c[kx[i]]), kx[i]));
			}
			fn = _C[keys] = _.any.apply(null, px);
		}
		return fn;
	};
	g.ctoken2 = function (key)
	{
		return _.rtoken(Date2.CultureInfo.regexPatterns[key]);
	};
	g.h = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), t.hour));
	g.hh = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/), t.hour));
	g.H = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), t.hour));
	g.HH = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/), t.hour));
	g.m = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.minute));
	g.mm = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.minute));
	g.s = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.second));
	g.ss = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.second));
	g.hms = _.cache(_.sequence([g.H, g.mm, g.ss], g.timePartDelimiter));
	g.t = _.cache(_.process(g.ctoken2("shortMeridian"), t.meridian));
	g.tt = _.cache(_.process(g.ctoken2("longMeridian"), t.meridian));
	g.z = _.cache(_.process(_.rtoken(/^(\+|\-)?\s*\d\d\d\d?/), t.timezone));
	g.zz = _.cache(_.process(_.rtoken(/^(\+|\-)\s*\d\d\d\d/), t.timezone));
	g.zzz = _.cache(_.process(g.ctoken2("timezone"), t.timezone));
	g.timeSuffix = _.each(_.ignore(g.whiteSpace), _.set([g.tt, g.zzz]));
	g.time = _.each(_.optional(_.ignore(_.stoken("T"))), g.hms, g.timeSuffix);
	g.d = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
	g.dd = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
	g.ddd = g.dddd = _.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"), function (s)
	{
		return function ()
		{
			this.weekday = s;
		};
	}));
	g.M = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/), t.month));
	g.MM = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/), t.month));
	g.MMM = g.MMMM = _.cache(_.process(g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), t.month));
	g.y = _.cache(_.process(_.rtoken(/^(\d\d?)/), t.year));
	g.yy = _.cache(_.process(_.rtoken(/^(\d\d)/), t.year));
	g.yyy = _.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/), t.year));
	g.yyyy = _.cache(_.process(_.rtoken(/^(\d\d\d\d)/), t.year));
	_fn = function ()
	{
		return _.each(_.any.apply(null, arguments), _.not(g.ctoken2("timeContext")));
	};
	g.day = _fn(g.d, g.dd);
	g.month = _fn(g.M, g.MMM);
	g.year = _fn(g.yyyy, g.yy);
	g.orientation = _.process(g.ctoken("past future"), function (s)
	{
		return function ()
		{
			this.orient = s;
		};
	});
	g.operator = _.process(g.ctoken("add subtract"), function (s)
	{
		return function ()
		{
			this.operator = s;
		};
	});
	g.rday = _.process(g.ctoken("yesterday tomorrow today now"), t.rday);
	g.unit = _.process(g.ctoken("minute hour day week month year"), function (s)
	{
		return function ()
		{
			this.unit = s;
		};
	});
	g.value = _.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/), function (s)
	{
		return function ()
		{
			this.value = s.replace(/\D/g, "");
		};
	});
	g.expression = _.set([g.rday, g.operator, g.value, g.unit, g.orientation, g.ddd, g.MMM]);
	_fn = function ()
	{
		return _.set(arguments, g.datePartDelimiter);
	};
	g.mdy = _fn(g.ddd, g.month, g.day, g.year);
	g.ymd = _fn(g.ddd, g.year, g.month, g.day);
	g.dmy = _fn(g.ddd, g.day, g.month, g.year);
	g.date = function (s)
	{
		return ((g[Date2.CultureInfo.dateElementOrder] || g.mdy).call(this, s));
	};
	g.format = _.process(_.many(_.any(_.process(_.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/), function (fmt)
	{
		if (g[fmt])
		{
			return g[fmt];
		}
		else
		{
			throw Date2.Parsing.Exception(fmt);
		}
	}), _.process(_.rtoken(/^[^dMyhHmstz]+/), function (s)
	{
		return _.ignore(_.stoken(s));
	}))), function (rules)
	{
		return _.process(_.each.apply(null, rules), t.finishExact);
	});
	var _F =
	{
	};
	var _get = function (f)
	{
		return _F[f] = (_F[f] || g.format(f)[0]);
	};
	g.formats = function (fx)
	{
		if (fx instanceof Array)
		{
			var rx = [];
			for (var i = 0; i < fx.length; i++)
			{
				rx.push(_get(fx[i]));
			}
			return _.any.apply(null, rx);
		}
		else
		{
			return _get(fx);
		}
	};
	g._formats = g.formats(["yyyy-MM-ddTHH:mm:ss", "ddd, MMM dd, yyyy H:mm:ss tt", "ddd MMM d yyyy HH:mm:ss zzz", "d"]);
	g._start = _.process(_.set([g.date, g.time, g.expression], g.generalDelimiter, g.whiteSpace), t.finish);
	g.start = function (s)
	{
		try
		{
			var r = g._formats.call(
			{
			}, s);
			if (r[1].length === 0)
			{
				return r;
			}
		}
		catch (e)
		{
		}
		return g._start.call(
		{
		}, s);
	};
}());

//Date2._parse = Date2.parse;		// original author replaced Date.parse() with a MUCH slower one.  We don't do this 'round these parts!
Date2.newparse = function (s)		// use new name for this slower but more versatile parse
{
	var r = null;
	if (!s)
	{
		return null;
	}
	try
	{
		r = Date2.Grammar.start.call(
		{
		}, s);
	}
	catch (e)
	{
		return null;
	}
	return ((r[1].length === 0) ? r[0] : null);
};

Date2.getParseFunction = function (fx)
{
	var fn = Date2.Grammar.formats(fx);
	return function (s)
	{
		var r = null;
		try
		{
			r = fn.call(
			{
			}, s);
		}
		catch (e)
		{
			return null;
		}
		return ((r[1].length === 0) ? r[0] : null);
	};
};
Date2.parseExact = function (s, fx)
{
	return Date2.getParseFunction(fx)(s);
};



/**
 * @version: 1.0 Alpha-1
 * @author: Coolite Inc. http://www.coolite.com/
 * @date: 2008-04-13
 * @copyright: Copyright (c) 2006-2008, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * @license: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/.
 * @website: http://www.datejs.com/
 */

/*
 * TimeSpan(milliseconds);
 * TimeSpan(days, hours, minutes, seconds);
 * TimeSpan(days, hours, minutes, seconds, milliseconds);
 */
var TimeSpan = function (days, hours, minutes, seconds, milliseconds) {
    var attrs = "days hours minutes seconds milliseconds".split(/\s+/);

    var gFn = function (attr) {
        return function () {
            return this[attr];
        };
    };

    var sFn = function (attr) {
        return function (val) {
            this[attr] = val;
            return this;
        };
    };

    for (var i = 0; i < attrs.length ; i++) {
        var $a = attrs[i], $b = $a.slice(0, 1).toUpperCase() + $a.slice(1);
        TimeSpan.prototype[$a] = 0;
        TimeSpan.prototype["get" + $b] = gFn($a);
        TimeSpan.prototype["set" + $b] = sFn($a);
    }

    if (arguments.length == 4) {
        this.setDays(days);
        this.setHours(hours);
        this.setMinutes(minutes);
        this.setSeconds(seconds);
    } else if (arguments.length == 5) {
        this.setDays(days);
        this.setHours(hours);
        this.setMinutes(minutes);
        this.setSeconds(seconds);
        this.setMilliseconds(milliseconds);
    } else if (arguments.length == 1 && typeof days == "number") {
        var orient = (days < 0) ? -1 : +1;
        this.setMilliseconds(Math.abs(days));

        this.setDays(Math.floor(this.getMilliseconds() / 86400000) * orient);
        this.setMilliseconds(this.getMilliseconds() % 86400000);

        this.setHours(Math.floor(this.getMilliseconds() / 3600000) * orient);
        this.setMilliseconds(this.getMilliseconds() % 3600000);

        this.setMinutes(Math.floor(this.getMilliseconds() / 60000) * orient);
        this.setMilliseconds(this.getMilliseconds() % 60000);

        this.setSeconds(Math.floor(this.getMilliseconds() / 1000) * orient);
        this.setMilliseconds(this.getMilliseconds() % 1000);

        this.setMilliseconds(this.getMilliseconds() * orient);
    }

    this.getTotalMilliseconds = function () {
        return (this.getDays() * 86400000) + (this.getHours() * 3600000) + (this.getMinutes() * 60000) + (this.getSeconds() * 1000);
    };

    this.compareTo = function (time) {
        var t1 = new Date2(1970, 1, 1, this.getHours(), this.getMinutes(), this.getSeconds()), t2;
        if (time === null) {
            t2 = new Date2(1970, 1, 1, 0, 0, 0);
        }
        else {
            t2 = new Date2(1970, 1, 1, time.getHours(), time.getMinutes(), time.getSeconds());
        }
        return (t1 < t2) ? -1 : (t1 > t2) ? 1 : 0;
    };

    this.equals = function (time) {
        return (this.compareTo(time) === 0);
    };

    this.add = function (time) {
        return (time === null) ? this : this.addSeconds(time.getTotalMilliseconds() / 1000);
    };

    this.subtract = function (time) {
        return (time === null) ? this : this.addSeconds(-time.getTotalMilliseconds() / 1000);
    };

    this.addDays = function (n) {
        return new TimeSpan(this.getTotalMilliseconds() + (n * 86400000));
    };

    this.addHours = function (n) {
        return new TimeSpan(this.getTotalMilliseconds() + (n * 3600000));
    };

    this.addMinutes = function (n) {
        return new TimeSpan(this.getTotalMilliseconds() + (n * 60000));
    };

    this.addSeconds = function (n) {
        return new TimeSpan(this.getTotalMilliseconds() + (n * 1000));
    };

    this.addMilliseconds = function (n) {
        return new TimeSpan(this.getTotalMilliseconds() + n);
    };

    this.get12HourHour = function () {
        return (this.getHours() > 12) ? this.getHours() - 12 : (this.getHours() === 0) ? 12 : this.getHours();
    };

    this.getDesignator = function () {
        return (this.getHours() < 12) ? Date2.CultureInfo.amDesignator : Date2.CultureInfo.pmDesignator;
    };

    this.toString = function (format) {
        this._toString = function () {
            if (this.getDays() !== null && this.getDays() > 0) {
                return this.getDays() + "." + this.getHours() + ":" + this.p(this.getMinutes()) + ":" + this.p(this.getSeconds());
            }
            else {
                return this.getHours() + ":" + this.p(this.getMinutes()) + ":" + this.p(this.getSeconds());
            }
        };

        this.p = function (s) {
            return (s.toString().length < 2) ? "0" + s : s;
        };

        var me = this;

        return format ? format.replace(/dd?|HH?|hh?|mm?|ss?|tt?/g,
        function (format) {
            switch (format) {
            case "d":
                return me.getDays();
            case "dd":
                return me.p(me.getDays());
            case "H":
                return me.getHours();
            case "HH":
                return me.p(me.getHours());
            case "h":
                return me.get12HourHour();
            case "hh":
                return me.p(me.get12HourHour());
            case "m":
                return me.getMinutes();
            case "mm":
                return me.p(me.getMinutes());
            case "s":
                return me.getSeconds();
            case "ss":
                return me.p(me.getSeconds());
            case "t":
                return ((me.getHours() < 12) ? Date2.CultureInfo.amDesignator : Date2.CultureInfo.pmDesignator).substring(0, 1);
            case "tt":
                return (me.getHours() < 12) ? Date2.CultureInfo.amDesignator : Date2.CultureInfo.pmDesignator;
            }
        }
        ) : this._toString();
    };
    return this;
};

/**
 * Gets the time of day for this date instances.
 * @return {TimeSpan} TimeSpan
 */
Date2.prototype.getTimeOfDay = function () {
    return new TimeSpan(0, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
};

/*
 * TimePeriod(startDate, endDate);
 * TimePeriod(years, months, days, hours, minutes, seconds, milliseconds);
 */
var TimePeriod = function (years, months, days, hours, minutes, seconds, milliseconds) {
    var attrs = "years months days hours minutes seconds milliseconds".split(/\s+/);

    var gFn = function (attr) {
        return function () {
            return this[attr];
        };
    };

    var sFn = function (attr) {
        return function (val) {
            this[attr] = val;
            return this;
        };
    };

    for (var i = 0; i < attrs.length ; i++) {
        var $a = attrs[i], $b = $a.slice(0, 1).toUpperCase() + $a.slice(1);
        TimePeriod.prototype[$a] = 0;
        TimePeriod.prototype["get" + $b] = gFn($a);
        TimePeriod.prototype["set" + $b] = sFn($a);
    }

    if (arguments.length == 7) {
        this.years = years;
        this.months = months;
        this.setDays(days);
        this.setHours(hours);
        this.setMinutes(minutes);
        this.setSeconds(seconds);
        this.setMilliseconds(milliseconds);
    } else if (arguments.length == 2 && arguments[0] instanceof Date && arguments[1] instanceof Date) {
        // startDate and endDate as arguments

        var d1 = years.clone();
        var d2 = months.clone();

        var temp = d1.clone();
        var orient = (d1 > d2) ? -1 : +1;

        this.years = d2.getFullYear() - d1.getFullYear();
        temp.addYears(this.years);

        if (orient == +1) {
            if (temp > d2) {
                if (this.years !== 0) {
                    this.years--;
                }
            }
        } else {
            if (temp < d2) {
                if (this.years !== 0) {
                    this.years++;
                }
            }
        }

        d1.addYears(this.years);

        if (orient == +1) {
            while (d1 < d2 && d1.clone().addDays(Date2.getDaysInMonth(d1.getYear(), d1.getMonth()) ) < d2) {
                d1.addMonths(1);
                this.months++;
            }
        }
        else {
            while (d1 > d2 && d1.clone().addDays(-d1.getDaysInMonth()) > d2) {
                d1.addMonths(-1);
                this.months--;
            }
        }

        var diff = d2 - d1;

        if (diff !== 0) {
            var ts = new TimeSpan(diff);
            this.setDays(ts.getDays());
            this.setHours(ts.getHours());
            this.setMinutes(ts.getMinutes());
            this.setSeconds(ts.getSeconds());
            this.setMilliseconds(ts.getMilliseconds());
        }
    }
    return this;
};

})();
