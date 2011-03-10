// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults
$(function() {
	// set opacity to nill on page load
	$("ul#menu span").css("opacity","0");
	// on mouse over
	$("ul#menu span").hover(function () {
		// animate opacity to full
		$(this).stop().animate({
			opacity: 1
		}, "slow");
	},
	// on mouse out
	function () {
		// animate opacity to nill
		$(this).stop().animate({
			opacity: 0
		}, "slow");
	});
});

