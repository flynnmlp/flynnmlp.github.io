"use strict";

document.addEventListener("mouseover", function() {
	if(event.target.nodeName.toLowerCase() == "code") {
		event.target.title = "Click to copy username";
	}
});

document.addEventListener("click", function() {
	if(event.target.nodeName.toLowerCase() == "code") {
		var text = event.target.textContent;
		navigator.clipboard.writeText(text);
		alert('"' + text + '" was copied to the clipboard.');
	}
});

addEventListener("load", function() {
	document.body.classList.add("click2copy");
});

