/*\
title: $:/plugins/BTC/musicsheets/modules/widgets/musicsheet.js
type: application/javascript
module-type: widget

renders abc music-notation to musical sheets

\*/
(function (global) {

"use strict";
/*jslint node: true, browser: true */
/*global $tw: false */

var Widget = require("$:/core/modules/widgets/widget.js").widget;

if (typeof window !== 'undefined') {
	require("$:/plugins/BTC/musicsheets/modules/widgets/abcjs-basic.js");
}

var ABCJSWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ABCJSWidget.prototype = new Widget();


ABCJSWidget.prototype.render = function(parent,nextSibling) {
	var self  = this;
	this.parentDomNode = parent;

	this.computeAttributes();
	this.execute();
	this.pNode = this.document.createElement("div");
	parent.insertBefore(this.pNode,nextSibling);
	if(this.tiddler) {
		this.tunebookString = $tw.wiki.getTiddlerText(self.tiddler);
		ABCJS.renderAbc(this.pNode, this.tunebookString);
		var width = parent.clientWidth*2/3;
		this.parentwidth = parent.clientWidth;

		ABCJS.renderAbc(this.pNode, "%%staffwidth "+width+"\n"+this.tunebookString, {
			hint_measures: self.hintMeasures,
			responsive: "resize",
			add_classes: true,
			oneSvgPerLine: self.svgPerLine
		});
	}
	this.domNodes.push(this.pNode);
	
	if(self.renderMidi === true) {
		this.tunebookString = $tw.wiki.getTiddlerText(self.tiddler);
		this.pNode2 = self.document.createElement("div");
		self.parentDomNode.insertBefore(this.pNode2,nextSibling);
		//if (typeof(MIDI) === 'undefined') 
		var MIDI = {};
		//if (typeof(MIDI.Soundfont) === 'undefined')
		MIDI.Soundfont = {};
		if(self.soundfont === "grand-piano") {
			MIDI.Soundfont.acoustic_grand_piano = $tw.wiki.getTiddlerText("$:/plugins/BTC/musicsheets/soundfonts/grand-piano.json");
		} else if(self.soundfont === "tuba") {
			MIDI.Soundfont.acoustic_grand_piano = $tw.wiki.getTiddlerText("$:/plugins/BTC/musicsheets/soundfonts/tuba.json");
		}

		ABCJS.renderMidi(this.pNode2, self.tunebookString, {
			generateDownload: true,
			downloadLabel: "download midi",
			inlineControls: {
				loopToggle: true,
				startPlaying: self.autoPlay
			},
			startingTune: 0
		});
		self.domNodes.push(this.pNode2);
	}

	self.parentDomNode.addEventListener("resize",function(event) {
		if(self.parentwidth != self.parentDomNode.clientWidth) {
			var width = parent.clientWidth*2/3;
			self.parentwidth = parent.clientWidth;
			ABCJS.renderAbc(self.pNode, "%%staffwidth "+width+"\n"+self.tunebookString);
		}
		return true;
	},false);

	this.renderChildren(self.parentDomNode,nextSibling);
};

/*
Compute the internal state of the widget
*/
ABCJSWidget.prototype.execute = function() {
	this.tiddler = this.getAttribute("tiddler",undefined);
	this.renderMidi = this.getAttribute("midi","") === "yes";
	this.soundfont = this.getAttribute("soundfont","");
	this.svgPerLine = this.getAttribute("separatelines") === "yes";
	this.hintMeasures = this.getAttribute("hints") === "yes";
	this.autoPlay = this.getAttribute("autoplay") === "yes";
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ABCJSWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.midi || changedAttributes.soundfont || changedAttributes.separatelines ||
		changedAttributes.hints || changedAttributes.autoplay || changedTiddlers[this.tiddler]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.musicsheet = ABCJSWidget;

})();