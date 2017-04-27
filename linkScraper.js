var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var baseUrl = "http://www.sherdog.com";
var eventLinks = [];
var fighterLinks = [];
var pageCount = 1;
var eventCount = 0;

//getEventLinks();
getFighterLinks();


function getEventLinks() {
	if (pageCount > 0) {
		processEventIndex(getEventLinks);
	} else {
		//console.log(eventLinks);
		fs.writeFile('eventLinks.txt', JSON.stringify(eventLinks, null, 4), 'utf8');
		console.log("done");
	}
}

function processEventIndex(callback) {
	indexUrl = "http://www.sherdog.com/organizations/Ultimate-Fighting-Championship-2/recent-events/0";
	indexUrl = indexUrl.slice(0, -1) + pageCount;
	request(indexUrl, function (error, response, body) {
		if (!error && response.statusCode !== 200) {
			console.log("error!");
			callback();
			return;
		}
		var $ = cheerio.load(body);
		var links = $("#recent_tab tr[itemtype='http://schema.org/Event']");
		links.each(function (index) {
			eventLinks.push(baseUrl + $(this).attr("onclick").split('\'')[1]);
		});
		if (links.length > 0) {
			pageCount++;
		} else {
			pageCount = -1;
		}
		callback();
	});
}

function getFighterLinks() {
	eventLinks = JSON.parse(fs.readFileSync('eventLinks.txt', 'utf8'));
	if (eventCount < eventLinks.length) {
		processEventPage(getFighterLinks);
	} else {
		fs.writeFile('fighterLinks.txt', JSON.stringify(fighterLinks, null, 4), 'utf8');
		console.log("done");
	}
}

function processEventPage(callback) {
	request(eventLinks[eventCount], function (error, response, body) {
		if (!error && response.statusCode !== 200) {
			console.log("error!");
			callback();
			return;
		}
		try {
			console.log(eventLinks[eventCount]);
			var $ = cheerio.load(body);
			var links = $("[itemtype='http://schema.org/Person'] a[itemprop='url']");
			links.each(function (index) {
				console.log
				fighterLinks.push(baseUrl + $(this).attr("href"));
			});
		} catch (error) {
			console.log(error);
		}
		eventCount++;
		callback();
	});
}
