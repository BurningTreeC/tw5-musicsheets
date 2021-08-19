/*\
title: $:/plugins/BTC/musicsheets/modules/widgets/musicsheet.js
type: application/javascript
module-type: widget

renders abc music-notation to musical sheets

\*/
(function() {

"use strict";
/*jslint node: true, browser: true */
/*global $tw: false */

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ABCJS;

if(typeof window !== 'undefined') {
	ABCJS = require("$:/plugins/BTC/musicsheets/lib/abcjs-basic.js");
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
	var renderedABC;
	if(this.tiddler) {
		this.tunebookString = $tw.wiki.getTiddlerText(self.tiddler);
		renderedABC = ABCJS.renderAbc(this.pNode, this.tunebookString);
		var width = parent.clientWidth*2/3;
		this.parentwidth = parent.clientWidth;

		ABCJS.renderAbc(this.pNode, "%%staffwidth "+width+"\n"+this.tunebookString, {
			hint_measures: self.hintMeasures,
			responsive: "resize",
			add_classes: true,
			oneSvgPerLine: self.svgPerLine
		});
	}
	if(this.renderMidi) {
		this.pNode2 = this.document.createElement("div");
		parent.insertBefore(this.pNode2,nextSibling);
		if(ABCJS.synth.supportsAudio()) {
			this.synthControl = new ABCJS.synth.SynthController();
			this.synthControl.load(this.pNode2, null, {displayRestart: true, displayPlay: true, displayProgress: true});
			this.synthControl.setTune(renderedABC, false);
			function setTune(userAction) {
				var midiBuffer = new ABCJS.synth.CreateSynth();
				midiBuffer.init({
					//audioContext: new AudioContext(),
					visualObj: renderedABC[0],
					// sequence: [],
					// millisecondsPerMeasure: 1000,
					// debugCallback: function(message) { console.log(message) },
					options: {
						// soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/" ,
						// sequenceCallback: function(noteMapTracks, callbackContext) { return noteMapTracks; },
						// callbackContext: this,
						// onEnded: function(callbackContext),
						// pan: [ -0.5, 0.5 ]
					}
				}).then(function (response) {
					console.log(response);
					if (self.synthControl) {
						self.synthControl.setTune(renderedABC[0], userAction).then(function (response) {
							console.log("Audio successfully loaded.")
							//seekControls.classList.remove("disabled");
							//seekExplanation();
						}).catch(function (error) {
							console.warn("Audio problem:", error);
						});
					}
				}).catch(function (error) {
					console.warn("Audio problem:", error);
				});
			}
			setTune(false);
		} else {
			this.pNode2.innerHTML = "<div class='audio-error'>Audio is not supported in this browser.</div>";
		}
		this.domNodes.push(this.pNode2)
	}
	this.domNodes.push(this.pNode);

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
		this.synthControl.pause();
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.musicsheet = ABCJSWidget;

})();