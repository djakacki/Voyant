Ext.define('Voyant.notebook.editor.TextEditor', {
	extend: 'Ext.Component',
	mixins: ['Voyant.util.Localization'],
	alias: 'widget.notebooktexteditor',
	cls: 'notebook-text-editor',
	config: {
		editor: undefined,
		isEditRegistered: false,
		currentHeight: 0,
		isFresh: undefined,
		isEnabled: false
	},
	statics: {
		i18n: {
		}
	},
	border: false,
	constructor: function(config) {
		config.isFresh = config.content ? false : true;
		Ext.apply(this, {
			html: config.content ? config.content : '<p style="text-align: center;">'+this.localize('emptyText')+'</p>'
		});
        this.callParent(arguments);
	},
	listeners: {
		boxready: function(cmp) {
			this.ownerCt.getTargetEl().on('click', function(e, t) {
				if (t.tagName !== 'A') {
					this.handleClick();
				}
			}, this);
		},
		removed: function(cmp, container) {
			// properly remove editor
			if (this.getEditor()) {
				this.getEditor().focusManager.blur(true); //focusManager bug workaround, see: https://dev.ckeditor.com/ticket/16825
				this.getEditor().destroy();
			}
		}
	},
	
	handleClick: function() {
		if (!this.getEditor()) {
			this._initEditor();
		} else {
			if (this.getIsEnabled() === false) {
				this._enable();
			}
		}
	},
	
	getContent: function() {
		return this.getTargetEl().dom.innerHTML;
	},

	_initEditor: function() {
		var el = this.getTargetEl();
		// when upgrading ckeditor, remember to copy stopediting and inserthtml4x plugins
		var editor = CKEDITOR.inline(el.dom, {
			toolbar: [
				{ name: 'basicstyles', items: [ 'Bold', 'Italic', '-', 'RemoveFormat' ] },
				{ name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Justify', 'Outdent', 'Indent', 'Blockquote', 'JustifyLeft', 'JustifyCenter', 'JustifyRight' ] },
				{ name: 'colors', items: [ 'TextColor', 'BGColor' ] },
				{ name: 'styles', items: [ 'Styles', 'Format' ] },
				{ name: 'links', items: [ 'Link', 'Unlink', 'Anchor'] },
				{ name: 'insert', items: [ 'Image', 'Table' ] },
				{ name: 'document', items: [ /*'inserthtml4x',*/ 'Sourcedialog', /*'Stopediting'*/] }
			],
			
			extraPlugins: 'sourcedialog,justify,colorbutton',//,stopediting,inserthtml4x',
			allowedContent: true,
			disableNativeSpellChecker: false,
			toolbarCanCollapse: false,
			startupFocus: 'end'
		});
		
		editor.on('contentDom', function() {
			this._enable();
			var editable = editor.editable();
			editable.attachListener(editable, 'click', function(evt) {
				// prevent further listeners from firing, esp. the one that prevents links from working ( https://stackoverflow.com/a/45616460 )
				evt.stop();
			}, null, null, 0); // zero (i.e. very high) priority
		}, this);

		editor.on('focus', function(evt) {
			if (this.getIsFresh()) {
				this.setIsFresh(false);
				this.getTargetEl().update('<p></p>'); // insert paragraphs because otherwise ckeditor will do it automatically
			}
		}, this);
		
		editor.on('blur', function(evt) {
			this._disable();
		}, this);

		editor.on('change', function() {
			var editorHeight = editor.container.$.clientHeight;
			if (editorHeight !== this.getCurrentHeight()) {
				this.findParentByType('notebookeditorwrapper').setHeight(editorHeight);
				this.setCurrentHeight(editor.container.$.clientHeight)
			}
			if (!this.getIsEditRegistered()) {
				this.findParentByType('notebook').setIsEdited(true);
				this.setIsEditRegistered(true);

			} else {
				var me = this; // make sure to allow edits to be auto-saved every 30 seconds
				setTimeout(function() {
					me.setIsEditRegistered(false);
				}, 30000);
			}
		}, this);

		this.setEditor(editor);
	},

	_enable: function() {
		this.getEditor().setReadOnly(false);
		this.getEditor().focus();

		this.findParentByType('notebookeditorwrapper').setIsEditing(true);
		this.setIsEnabled(true);
	},

	_disable: function() {
		this.getEditor().setReadOnly(true);

		this.findParentByType('notebookeditorwrapper').setIsEditing(false);
		this.setIsEnabled(false);
	}
})