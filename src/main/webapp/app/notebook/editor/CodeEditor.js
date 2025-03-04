Ext.define("Voyant.notebook.editor.CodeEditor", {
	extend: "Ext.Component",
	alias: "widget.notebookcodeeditor", 
	mixins: ["Voyant.util.Localization",'Voyant.notebook.util.Embed'],
	embeddable: ["Voyant.notebook.editor.CodeEditor"],
	cls: 'notebook-code-editor',
	config: {
		// theme: 'ace/theme/chrome',
		mode: 'javascript',
		content: '',
		docs: undefined,
		isChangeRegistered: false,
		editor: undefined,
		editedTimeout: undefined,
		lines: 1, // tracks the number of lines in the editor
		markers: []
	},
	statics: {
		i18n: {
		},
		api: {
			content: undefined
		},
		ternServer: undefined
	},

	MIN_LINES: 6,

	constructor: function(config) {
		this.callParent(arguments);
	},
	listeners: {
		render: function() {
			var me = this;
			var editorTarget = Ext.getDom(this.getEl());
			var editor = CodeMirror(editorTarget, {
				mode: this._getModeConfig(this.getMode()),
				value: this.getContent(),
				lineNumbers: true,
				lineWrapping: true,
				styleActiveLine: true,
				viewportMargin: 50, // lines rendered above and below current view
				extraKeys: {
					'Shift-Enter': function() {
						me.up('notebookrunnableeditorwrapper').run();
					},
					'Shift-Ctrl-Enter': function() {
						var wrapper = me.up('notebookrunnableeditorwrapper');
						wrapper.up('notebook').runUntil(wrapper);
					},
					'Shift-Cmd-Enter': function() {
						var wrapper = me.up('notebookrunnableeditorwrapper');
						wrapper.up('notebook').runUntil(wrapper);
					},
					'Ctrl-/': function() {
						editor.toggleComment();
					},
					'Cmd-/': function() {
						editor.toggleComment();
					}
				}
			});

			var minHeight = ((this.MIN_LINES+1) * editor.defaultTextHeight()) + 'px';
			var editorWrapperEl = editor.getWrapperElement();
			editorWrapperEl.style.height = 'auto';
			editorWrapperEl.style.minHeight = minHeight;
			editor.getScrollerElement().style.minHeight = minHeight;
			
			editor.on('change', function(editor, ev) {
				me.clearMarkers();
				
				var lines = editor.lineCount();
				if (lines !== me.getLines()) {
					me.setLines(lines);
					setTimeout(function() {
						var height = editor.getWrapperElement().offsetHeight;
						me.setSize({height: height});
					}, 0);
				}

				if (me.getIsChangeRegistered() === false) {
					me.setIsChangeRegistered(true);
					var wrapper = me.up('notebookrunnableeditorwrapper');
					wrapper.setIsRun(false);
					wrapper.up('notebook').setIsEdited(true);
				} else {
					if (!me.getEditedTimeout()) { // no timeout, so set it to 30 seconds
						me.setEditedTimeout(setTimeout(function() {
							me.setIsChangeRegistered(false);
						}, 30000));
					}
				}
			}, this);

			if (this.getMode() === 'javascript') {
				if (Voyant.notebook.editor.CodeEditor.ternServer === undefined) {
					var defs = this.getDocs();
					var url = this.up('notebook').getApplication().getBaseUrlFull();
					Voyant.notebook.editor.CodeEditor.ternServer = new CodeMirror.TernServer({
						defs: defs,
						useWorker: true,
						workerScript: url+'resources/spyral/tern/worker.js',
						workerDeps: ['tern_worker_deps.js']
					});
				}
				
				Object.assign(editor.getOption('extraKeys'), {
					'Ctrl-Space': function(ed) { Voyant.notebook.editor.CodeEditor.ternServer.complete(ed); },
					'Ctrl-O': function(ed) { Voyant.notebook.editor.CodeEditor.ternServer.showDocs(ed); }
				});
				editor.on('cursorActivity', function(ed) { Voyant.notebook.editor.CodeEditor.ternServer.updateArgHints(ed); });
			}

			this.setEditor(editor);

			this._setModeOptions(this.getMode());

			me.fireEvent('resize', me);

		},
		removed: function(cmp, container) {
			if (cmp.getEditor()) {
				cmp.setEditor(undefined);
			}
		}
		
	},

	_getModeConfig: function(mode) {
		var modeConfig = undefined;
		switch (mode) {
			case 'json':
				modeConfig = { name: 'javascript', json: true };
				break;
			case 'xml':
				modeConfig = 'xml';
				break;
			case 'html':
				modeConfig = { name: 'xml', htmlMode: true }
			default:
				modeConfig = 'javascript';
		}
		return modeConfig;
	},

	_setModeOptions: function(mode) {
		var options = {};
		switch (mode) {
			case 'json':
			case 'javascript':
				options.autoCloseBrackets = true;
				options.matchBrackets = true;
				break;
			default:
				options.autoCloseBrackets = false;
				options.matchBrackets = false;
				break;
		}
		for (var key in options) {
			this.getEditor().setOption(key, options[key]);
		}
	},
	
	switchModes: function(mode) {
		console.log('mode', mode);
		this.setMode(mode);
		if (this.rendered) {
			this.getEditor().setOption('mode', this._getModeConfig(mode));
			this._setModeOptions(mode);
		}
	},
	
	getValue: function() {
		return this.getEditor().getValue();
	},

	addMarker: function(location, type) {
		type = type === undefined ? 'error' : type;
		var cls = 'spyral-editor-'+type;
		var row = location[0];
		var col = location[1];
		col--;
		row--;
		var marker = this.getEditor().getDoc().markText(
			{line: row, ch: col},
			{line: row, ch: col+1},
			{className: cls}
		);
		this.getMarkers().push(marker);
	},

	addLineMarker: function(location, type) {
		type = type === undefined ? 'error' : type;
		var cls = 'spyral-editor-'+type;
		var row = location[0];
		row--;
		var marker = this.getEditor().getDoc().addLineClass(row, 'gutter', cls);
		this.getMarkers().push({marker: marker, where: 'gutter', cls: cls});
	},

	clearMarkers: function() {
		var editor = this.getEditor();
		var markers = this.getMarkers();
		markers.forEach(function(marker) {
			if (marker.marker) {
				editor.getDoc().removeLineClass(marker.marker, marker.where, marker.cls);
			} else {
				marker.clear();
			}
		});
		this.setMarkers([]);
	}
})