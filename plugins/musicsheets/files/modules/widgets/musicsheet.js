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
	this.pNode.className = "tc-music-sheet";
	parent.insertBefore(this.pNode,nextSibling);

	var programs = ["acoustic_grand_piano", "bright_acoustic_piano", "electric_grand_piano", "honkytonk_piano", "electric_piano_1", "electric_piano_2", "harpsichord", "clavinet", "celesta", "glockenspiel", "music_box", "vibraphone", "marimba", "xylophone", "tubular_bells", "dulcimer", "drawbar_organ", "percussive_organ", "rock_organ", "church_organ", "reed_organ", "accordion", "harmonica", "tango_accordion", "acoustic_guitar_nylon", "acoustic_guitar_steel", "electric_guitar_jazz", "electric_guitar_clean", "electric_guitar_muted", "overdriven_guitar", "distortion_guitar", "guitar_harmonics", "acoustic_bass", "electric_bass_finger", "electric_bass_pick", "fretless_bass", "slap_bass_1", "slap_bass_2", "synth_bass_1", "synth_bass_2", "violin", "viola", "cello", "contrabass", "tremolo_strings", "pizzicato_strings", "orchestral_harp", "timpani", "string_ensemble_1", "string_ensemble_2", "synth_strings_1", "synth_strings_2", "choir_aahs", "voice_oohs", "synth_choir", "orchestra_hit", "trumpet", "trombone", "tuba", "muted_trumpet", "french_horn", "brass_section", "synth_brass_1", "synth_brass_2", "soprano_sax", "alto_sax", "tenor_sax", "baritone_sax", "oboe", "english_horn", "bassoon", "clarinet", "piccolo", "flute", "recorder", "pan_flute", "blown_bottle", "shakuhachi", "whistle", "ocarina", "lead_1_square", "lead_2_sawtooth", "lead_3_calliope", "lead_4_chiff", "lead_5_charang", "lead_6_voice", "lead_7_fifths", "lead_8_bass_lead", "pad_1_new_age", "pad_2_warm", "pad_3_polysynth", "pad_4_choir", "pad_5_bowed", "pad_6_metallic", "pad_7_halo", "pad_8_sweep", "fx_1_rain", "fx_2_soundtrack", "fx_3_crystal", "fx_4_atmosphere", "fx_5_brightness", "fx_6_goblins", "fx_7_echoes", "fx_8_scifi", "sitar", "banjo", "shamisen", "koto", "kalimba", "bagpipe", "fiddle", "shanai", "tinkle_bell", "agogo", "steel_drums", "woodblock", "taiko_drum", "melodic_tom", "synth_drum", "reverse_cymbal", "guitar_fret_noise", "breath_noise", "seashore", "bird_tweet", "telephone_ring", "helicopter", "applause", "gunshot", "percussion"];
	var program = programs.indexOf(this.program);
	if(program === -1) {
		program = 0;
	}
	var renderedABC;
	if(this.text) {
		var width = parent.clientWidth*2/3;
		renderedABC = ABCJS.renderAbc(this.pNode, "%%staffwidth "+width+"\n"+this.text, {
			hint_measures: false,
			responsive: "resize",
			add_classes: true,
			oneSvgPerLine: self.svgPerLine
		});
		var midi = ABCJS.synth.getMidiFile(renderedABC[0], { chordsOff: true, midiOutputType: "link" });
		this.midiNode = this.document.createElement("div");
		this.midiNode.innerHTML = midi;
		this.midiNode.className = "tc-midi-download";
		parent.insertBefore(this.midiNode,nextSibling);
		this.domNodes.push(this.midiNode);
	}
	if(renderedABC && this.renderMidi) {
		this.pNode2 = this.document.createElement("div");
		this.pNode2.className = "tc-playback-controls";
		parent.insertBefore(this.pNode2,nextSibling);
		if(ABCJS.synth.supportsAudio()) {
			this.synthControl = new ABCJS.synth.SynthController();
			this.synthControl.load(this.pNode2, null, {displayLoop: true, displayRestart: true, displayPlay: true, displayProgress: true, displayWarp: true});
			this.synthControl.setTune(renderedABC[0], false, { program: program });
		} else {
			this.pNode2.innerHTML = "<div class='audio-error'>Audio is not supported in this browser.</div>";
		}
		this.domNodes.push(this.pNode2);
	}
	this.domNodes.push(this.pNode);
};

/*
Compute the internal state of the widget
*/
ABCJSWidget.prototype.execute = function() {
	this.text = this.getAttribute("text",undefined);
	this.renderMidi = this.getAttribute("midi","no") === "yes";
	this.svgPerLine = this.getAttribute("separatelines","no") === "yes";
	this.sound = this.getAttribute("sound");
	this.program = this.sound || this.wiki.getTiddlerText("$:/config/musicsheets/program") || "acoustic_grand_piano";
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ABCJSWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text || changedAttributes.midi || changedAttributes.separatelines || 
		changedAttributes.sound || (changedTiddlers["$:/config/musicsheets/program"] && !this.sound)) {
		this.synthControl.pause();
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.musicsheet = ABCJSWidget;

})();