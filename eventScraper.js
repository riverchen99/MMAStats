var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var eventStats = [];
var eventLinks = [];

var eventCount = 0;

getEventStats();

function getEventStats() {
	eventLinks = JSON.parse(fs.readFileSync('eventLinks.txt', 'utf8'));
	if (eventCount < eventLinks.length) {
		processEventPage(getEventStats);
	} else {
		fs.writeFile('eventStats.json', JSON.stringify(eventStats, null, 4), 'utf8');
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
			var $ = cheerio.load(body);
			//$("div div h1 span br").replaceWith('&nbsp;');
			//console.log("Event: " + $("div.section_title h1 span").text());
			console.log("Event: " + $("meta[property = 'og:title']").attr("content"));
			/*
			console.log("Event: " + $("div.section_title h1 span").text());
			console.log("Organization: " + $("div.section_title h2 span").text());
			console.log("Time: " + $("meta[itemprop = 'startDate']").attr("content"));
			console.log("Location: " + $("span[itemprop = 'location']").text());
			*/

			fights = [];
			method_text = $("table.resume td").eq(1).text().substring(7);
			if (method_text.includes(" (")) {
				main_method = method_text.split(" (")[0];
				sub_method = method_text.split(" (")[1].slice(0, -1);
			} else if (method_text.includes(" - ")) {
				main_method = method_text.split(" - ")[0];
				sub_method = method_text.eq(1).text().substring(7).split(" - ")[1];
			} else {
				main_method = method_text.eq(1).text().substring(7);
				sub_method = "N/A";
			}
			fights.push({
				"main": true,
				"match": parseInt($("table.resume td").eq(0).text().split(" ")[1]),
				"winner": $("div.fighter.left_side").children().find("span[itemprop = 'name']").text(),
				"loser": $("div.fighter.right_side").children().find("span[itemprop = 'name']").text(),
				"main_method": main_method,
				"sub_method": sub_method,
				"referee": $("table.resume td").eq(2).text().substring(8),
				"round": parseInt($("table.resume td").eq(3).text().split(" ")[1]),
				"min": parseInt($("table.resume td").eq(4).text().split(" ")[1].split(":")[0]),
				"sec": parseInt($("table.resume td").eq(4).text().split(" ")[1].split(":")[1]),
			})

			$("tr[itemprop = 'subEvent']").each(function (index) {
				method_text = $(this).children().eq(4).contents().get(0).nodeValue;
				if (method_text.includes(" (")) {
					main_method = method_text.split(" (")[0];
					sub_method = method_text.split(" (")[1].slice(0, -1);
				} else if (method_text.includes(" - ")) {
					main_method = method_text.split(" - ")[0];
					sub_method = method_text.split(" - ")[1];
				} else {
					main_method = method_text;
					sub_method = "N/A";
				}
				fights.push({
					"main": false,
					"match": parseInt($(this).children().eq(0).text().trim()),
					"winner": $(this).children().find("td.text_right.col_fc_upcoming span[itemprop = 'name']").text(),
					"loser": $(this).children().find("td.text_left.col_fc_upcoming span[itemprop = 'name']").text(),
					"main_method": main_method,
					"sub_method": sub_method,
					"referee": $(this).children().find("span.sub_line").text(),
					"round": parseInt($(this).children().eq(5).text()),
					"min": parseInt($(this).children().eq(6).text().split(":")[0]),
					"sec": parseInt($(this).children().eq(6).text().split(":")[1]),
				})
			})

			eventStats.push({
				"event": $("meta[property = 'og:title']").attr("content"),
				"organization": $("div.section_title h2 span").text(),
				"date": $("meta[itemprop = 'startDate']").attr("content").split("T")[0],
				"time": $("meta[itemprop = 'startDate']").attr("content").split("T")[1],
				"location": $("span[itemprop = 'location']").text(),
				"fights": fights,
			});

		} catch (error) { // event cancelled
			console.log(error);
			console.log("error: " + eventLinks[eventCount]);
		}
		eventCount++;
		callback();
	});
}