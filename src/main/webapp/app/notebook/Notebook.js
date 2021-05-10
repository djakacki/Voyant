/*
 * @class Notebook
 * A Spyral Notebook. This should never be instantiated directly.
 */
Ext.define('Voyant.notebook.Notebook', {
	alternateClassName: ["Notebook"],
	extend: 'Ext.panel.Panel',
	requires: ['Voyant.notebook.editor.CodeEditorWrapper','Voyant.notebook.editor.TextEditorWrapper','Voyant.notebook.util.Show','Voyant.panel.Cirrus','Voyant.panel.Summary','Voyant.notebook.StorageDialogs','Voyant.notebook.github.GitHubDialogs'],
	mixins: ['Voyant.panel.Panel'],
	alias: 'widget.notebook',
    statics: {
    	i18n: {
    		title: "Spyral",
    		metadataEditor: "Edit Metadata",
    		metadataTitle: "Title",
    		metadataTip: "Edit notebook metadata.",
    		metadataAuthor: "Author(s)",
    		metadataKeywords: "Keywords",
    		metadataDescription: "Description",
    		metadataLicense: "Licence",
    		metadataLanguage: "Language",
    		metadataReset: "Reset",
    		metadataSave: "Save",
    		metadataCancel: "Cancel",
    		created: "Created",
    		modified: "Modified",
    		clickToEdit: "Click to edit",
    		cantLoadNotebook: "Unable to load Spyral notebook:",
    		cannotLoadJson: "Unable to parse JSON input.",
    		cannotLoadJsonUnrecognized: "Unable to recognize JSON input.",
    		cannotLoadUnrecognized: "Unable to recognize input.",
    		openTitle: "Open",
    		openMsg: "Paste in Notebook ID, a URL or a Spyral data file (in HTML).",
    		exportHtmlDownload: "HTML (download)",
    		errorParsingDomInput: "An error occurred while parsing the input of the document. The results might still work, except if the code contained HTML tags."
    	},
    	api: {
    		input: undefined,
    		inputEncodedBase64Json: undefined,
    		run: undefined
    	}
    },
    config: {
        /**
         * @private
         */
    	notebookId: undefined,
        /**
         * @private
         */
    	metadata: undefined,
        /**
         * @private
         */
    	isEdited: false,
    	/**
    	 * @private
    	 */
    	version: "3.0",
    	/**
    	 * @private
    	 */
		currentBlock: undefined,
		/**
		 * @private
		 * Which solution to use for storing notebooks, either: 'voyant' or 'github'
		 */
		storageSolution: 'voyant'
	},
	
	metadataWindow: undefined,
	voyantStorageDialogs: undefined,
	githubDialogs: undefined,
	catalogueWindow: undefined,

	spyralTernDocs: undefined, // holds the content of the spyral tern docs, for passing to the code editor
    
    /**
     * @private
     */
    constructor: function(config) {
    	Ext.apply(config, {
    		title: this.localize('title'),
    	    autoScroll: true,
    		includeTools: {
				'help': true,
				'gear': true,
    			'save': true,
    			'saveIt': {
    				tooltip: this.localize("saveItTip"),
    				itemId: 'saveItTool',
    				xtype: 'toolmenu',
    				glyph: 'xf0c2@FontAwesome',
					disabled: true,
					items: [{
						text: 'Save',
						xtype: 'menuitem',
						glyph: 'xf0c2@FontAwesome',
						handler: this.showSaveDialog.bind(this, false),
						scope: this
					},{
						text: 'Save As...',
						xtype: 'menuitem',
						glyph: 'xf0c2@FontAwesome',
						handler: this.showSaveDialog.bind(this, true),
						scope: this
					},'-',{
						text: 'Storage',
						xtype: 'menuitem',
						menu: {
							items: [{
								text: 'Voyant',
								xtype: 'menucheckitem',
								group: 'storageSolution',
								checked: true,
								handler: this.setStorageSolution.bind(this, 'voyant'),
								scope: this
							},{
								text: 'GitHub',
								xtype: 'menucheckitem',
								group: 'storageSolution',
								checked: false,
								handler: this.setStorageSolution.bind(this, 'github'),
								scope: this
							}]
						}
					}]
    			},
    			'new': {
    				tooltip: this.localize("newTip"),
    				callback: function() {
    	    			let url = this.getBaseUrl()+"spyral/";
						this.getApplication().openUrl(url);
    				},
    				xtype: 'toolmenu',
    				glyph: 'xf067@FontAwesome',
    				scope: this
    			},
    			'open': {
    				tooltip: this.localize("openTip"),
    				xtype: 'toolmenu',
					glyph: 'xf115@FontAwesome',
					callback: function(panel, tool) {
						const storageSolution = this.getStorageSolution();
						if (storageSolution === undefined) {
						} else {
							setTimeout(() => {
								tool.toolMenu.hide()
							})
							if (storageSolution === 'github') {
								this.githubDialogs.showLoad();
							} else {
								Ext.Msg.prompt(this.localize("openTitle"),this.localize("openMsg"),function(btn, text) {
									text = text.trim();
									if (btn=="ok") {
										this.clear();
										this.loadFromString(text);
									}
								}, this, true);
							}
						}
					},
					scope: this,
					items: [{
						text: 'Load',
						xtype: 'menuitem',
						glyph: 'xf115@FontAwesome',
						handler: function() {
							Ext.Msg.prompt(this.localize("openTitle"),this.localize("openMsg"),function(btn, text) {
								text = text.trim();
								if (btn=="ok") {
									this.clear();
									this.loadFromString(text);
								}
							}, this, true);
						},
						scope: this
					},{
						text: 'Load from GitHub',
						xtype: 'menuitem',
						glyph: 'xf115@FontAwesome',
						handler: function() {
							this.githubDialogs.showLoad();
						},
						scope: this
					}]
    			},
    			'runall': {
    				tooltip: this.localize("runallTip"),
    				callback: this.runAll,
    				xtype: 'toolmenu',
    				glyph: 'xf04e@FontAwesome',
    				scope: this
    			},
    			'metadata': {
    				tooltip: this.localize("metadataTip"),
    				callback: this.showMetadataEditor,
					xtype: 'toolmenu',
					glyph: 'xf02c@FontAwesome',
					scope: this
    			},
                'catalogue': {
                    tooltip: 'catalogue',
                    callback: function() {
                        this.catalogueWindow.showWindow();
                    },
                    xtype: 'toolmenu',
                    glyph: 'xf00b@FontAwesome',
                    scope: this
                }
    		},
    			
    		items: [{
    			itemId: 'spyralHeader',
    			cls: 'spyral-header',
    			listeners: {
    				afterrender: function(header) {
    					Ext.tip.QuickTipManager.register({
    						  target: header.getId(),
    						  text: this.localize("clickToEdit")
    						});
    					var head = header;
    					header.getTargetEl().on("click", function(header) {
    						this.showMetadataEditor();
    						head.removeCls("editable");
    					}, this);
    					header.mon(header.getEl(), "mouseover", function() {header.addCls("editable")});
    					header.mon(header.getEl(), "mouseout", function() {header.removeCls("editable")});
    				},
    				scope: this
    			}
    		},{
    			xtype: 'container',
    			itemId: 'cells'
    		},{
    			itemId: 'spyralFooter',
    			cls: 'spyral-footer',
    			listeners: {
    				afterrender: function(footer) {
    					Ext.tip.QuickTipManager.register({
  						  target: footer.getId(),
  						  text: this.localize("clickToEdit")
  						});
    					var foot = footer;
    					footer.getTargetEl().on("click", function(footer) {
    						this.showMetadataEditor();
    						foot.removeCls("editable");
    					}, this);
    					footer.mon(footer.getEl(), "mouseover", function() {footer.addCls("editable")});
    					footer.mon(footer.getEl(), "mouseout", function() {footer.removeCls("editable")});
    				},
    				scope: this
    			}
    		}],
    		listeners: {
    			afterrender: this.init,
    			notebookWrapperMoveUp: this.notebookWrapperMoveUp,
    			notebookWrapperMoveDown: this.notebookWrapperMoveDown,
    			notebookWrapperRemove: this.notebookWrapperRemove,
				notebookWrapperAdd: this.notebookWrapperAdd,
				notebookLoaded: this.autoExecuteCells,
    			scope: this
    		}
    	})
        this.callParent(arguments);
    	this.mixins['Voyant.panel.Panel'].constructor.apply(this, arguments);

		this.voyantStorageDialogs = new Voyant.notebook.StorageDialogs({
			listeners: {
				'fileLoaded': function(src) {

				},
				'fileSaved': function(src, notebookId) {
					this.unmask();
					if (notebookId !== null) {
						var id = this.getNotebookId();
						if (!id || notebookId!=id) {
							this.setNotebookId(notebookId);
						}
						this.toastInfo({
							html: this.localize('saved'),
							anchor: 'tr'
						});
						this.setIsEdited(false);
					} else {
						// save error
					}
				},
				'saveCancelled': function() {
				},
				'close': function() {
					this.unmask();
				},
				scope: this
			}
		});

		this.githubDialogs = new Voyant.notebook.github.GitHubDialogs({
			listeners: {
				'fileLoaded': function(src, {owner, repo, ref, path, file}) {
					this.githubDialogs.close();
					this.clear();
					this.loadFromString(file);

					const id = encodeURIComponent(owner+'/'+repo+'/'+path);
					if (location.search.indexOf(id) === -1) {
						const url = this.getBaseUrl()+'spyral/?githubId='+id;
						window.history.pushState({
							url: url
						}, 'Spyral Notebook: '+id, url);
					}
				},
				'fileSaved': function(src, {owner, repo, branch, path}) {
					this.githubDialogs.close();
					this.unmask();
					this.toastInfo({
						html: this.localize('saved'),
						anchor: 'tr'
					});
					this.setIsEdited(false);

					const id = encodeURIComponent(owner+'/'+repo+'/'+path);
					if (location.search.indexOf(id) === -1) {
						const url = this.getBaseUrl()+'spyral/?githubId='+id;
						window.history.pushState({
							url: url
						}, 'Spyral Notebook: '+id, url);
					}
				},
				'saveCancelled': function(src) {
					this.unmask();
				},
				scope: this
			}
		});

		this.catalogueWindow = new Voyant.notebook.Catalogue({
			listeners: {
				notebookSelected: function(catalogue, notebookId) {
					catalogue.hideWindow();
					this.clear();
					this.loadFromId(notebookId);
					this.setNotebookId(notebookId);
				},
				scope: this
			}
		});
    },
    
    init: function() {
		// add static / global functions from Spyral
		window.Corpus = Spyral.Corpus;
		window.Table = Spyral.Table;

		window.loadCorpus = function() {
			return Spyral.Corpus.load.apply(Spyral.Corpus.load, arguments)
		}

		window.createTable = function() {
			return Spyral.Table.create.apply(Spyral.Table, arguments)
		}

		window.onbeforeunload = function() {
			if (this.getIsEdited()) {
				return ''; // return any string to prompt the browser to warn the user they have unsaved changes
			}
		}.bind(this);

		// need to load docs first
		Ext.Ajax.request({
			url: this.getApplication().getBaseUrlFull()+'resources/spyral/docs/spyral.json',
			callback: function(opts, success, response) {
				if (success) {
					this.spyralTernDocs = Ext.JSON.decode(response.responseText);
					
					// add docs for static / global functions
					this.spyralTernDocs.Corpus = this.spyralTernDocs.Spyral.Corpus;
					this.spyralTernDocs.Table = this.spyralTernDocs.Spyral.Table;
					this.spyralTernDocs.loadCorpus = this.spyralTernDocs.Spyral.Corpus.load;
					this.spyralTernDocs.createTable = this.spyralTernDocs.Spyral.Table.create;
				}

				var queryParams = Ext.Object.fromQueryString(document.location.search, true);
				var isRun = Ext.isDefined(queryParams.run);
				var spyralIdMatches = /\/spyral\/([\w-]+)\/?$/.exec(location.pathname);
				var isGithub = Ext.isDefined(queryParams.githubId);
				if ("inputJsonArrayOfEncodedBase64" in queryParams) {
					let json = Ext.decode(decodeURIComponent(atob(queryParams.inputJsonArrayOfEncodedBase64)));
					json.forEach(function(block, index) {
						let text = block;
						if (text.trim().indexOf("<")==0) {
							if (index === 0) {
								// assume first text block is metadata
								this.setMetadata(new Spyral.Metadata({
									title: text
								}));
							} else {
								this.addText(text);
							}
						} else {
							this.addCode(text);
						}
					}, this);
				} else if (queryParams.input) {
					if (queryParams.input.indexOf("http")===0) {
						this.loadFromUrl(queryParams.input, isRun);
					}
				} else if (spyralIdMatches) {
					this.loadFromId(spyralIdMatches[1]);
					this.setStorageSolution('voyant');
				} else if (isGithub) {
					this.githubDialogs.loadFileFromId(queryParams.githubId);
					this.setStorageSolution('github');
				} else {
					this.addNew();
					this.setIsEdited(false);
				}
				
				if (isRun) {
					var me = this;
					Ext.defer(function() {
						me.runAll()
					}, 100)
				}

			},
			scope: this
		})
    },
    
    setBlock: function(data, offset, mode, config) {
    	data = data || "";
    	offset = offset || 1;
    	config = config || {};
    	var containers = this.query("notebookeditorwrapper");
    	var id = this.getCurrentBlock().id;
    	var current = containers.findIndex(function(container) {return container.id==id})
    	if (current+offset<0 || current+offset>containers.length) { // wanting to place before beginning or one beyond end
			Ext.Msg.show({
				title: this.localize('error'),
				msg: this.localize('blockDoesNotExist'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR
			});
			return undefined
    	}
    	
    	// I can't seem to set the content, so we'll go nuclear and remove the block
    	if (containers[current+offset]) {
        	var cells = this.getComponent("cells");
    		cells.remove(containers[current+offset]);
    	}
    	return this.addCode(Object.assign({},{
    		input: data,
    		mode: mode || "text"
    	}, config), current+offset);
    },
    getBlock: function(offset, config) {
    	offset = offset || 0;
    	config = config || {};
    	var containers = this.query("notebookcodeeditorwrapper");
    	var id = this.getCurrentBlock().id;
    	var current = containers.findIndex(function(container) {return container.id==id})
    	if (current+offset<0 || current+offset>containers.length-1) {
    		if ("failQuietly" in config && config.failQuietly) {}
    		else {
    			Ext.Msg.show({
    				title: this.localize('error'),
    				msg: this.localize('blockDoesNotExist'),
    				buttons: Ext.MessageBox.OK,
    				icon: Ext.MessageBox.ERROR
    			});
    		}
			return undefined;
    	}
    	content = containers[current+offset].getContent();
    	return content.input;
//    	debugger
//    	var mode = containers[current+offset].editor.getMode().split("/").pop();
//    	if (content.mode=="xml") {
//    		return new DOMParser().parseFromString(content.input, 'text/xml')
//    	} else if (content.mode=="json") {
//    		return JSON.parse(content.input);
//    	} else if (content.mode=="html") {
//    		return new DOMParser().parseFromString(content.input, 'text/html')
//    	} else {
//    		return content.input;
//    	}
    },
    
    addNew: function() {
		this.setMetadata(new Spyral.Metadata({
			title: "<h1>Spyral Notebook</h1>"
		}));
		this.addText("<p>This is a Spyral Notebook, a dynamic document that combines writing, code and data in service of reading, analyzing and interpreting digital texts.</p><p>Spyral Notebooks are composed of text blocks (like this one) and code blocks (like the one below). You can <span class='marker'>click on the blocks to edit</span> them and add new blocks by clicking add icon that appears in the left column when hovering over a block.</p>");
		var code = this.addCode('');
		Ext.defer(function() {
			code.run();
		}, 100, this);
    },
    
    clear: function() {
		this.setMetadata(new Spyral.Metadata());
		this.voyantStorageDialogs.reset();
    	var cells = this.getComponent("cells");
    	cells.removeAll();
	},

	showSaveDialog: function(saveAs) {
		this.mask(this.localize('saving'));
		this.getMetadata().setDateNow("modified");

		const data = this.generateExportHtml();
		const metadata = this.getMetadata().clone(); // use a clone so that altering title and description doesn't affect original

		if (metadata.title) {
			metadata.title = metadata.title.replace(/<\/?\w+.*?>/g, '');
		}
		if (metadata.description) {
			metadata.description = metadata.description.replace(/<\/?\w+.*?>/g, '');
		}

		if (metadata.keywords) {
			if (Array.isArray(metadata.keywords) === false) {
				metadata.keywords = metadata.keywords.split(/[\s,]+/)
			}
			metadata.keywords = metadata.keywords.reduce(function(keywordsArray, keyword) {
				if (keyword.length > 0) {
					keywordsArray.push(keyword.toLowerCase());
				}
				return keywordsArray;
			}, []);
		}

		const storageSolution = this.getStorageSolution();
		
		if (!saveAs && storageSolution === 'voyant' && this.getNotebookId() !== undefined && this.voyantStorageDialogs.getAccessCode() !== undefined) {
			this.voyantStorageDialogs.doSave({
				notebookId: this.getNotebookId(),
				data: data,
				metadata: metadata,
				accessCode: this.voyantStorageDialogs.getAccessCode()
			});
		} else {
			if (storageSolution === 'github') {
				this.githubDialogs.showSave(data);
			} else {
				this.voyantStorageDialogs.showSave(data, metadata, saveAs ? undefined : this.getNotebookId());
			}
		}
	},
	
    loadFromString: function(text) {
    	text = text.trim();
		if (text.indexOf("http")==0) {
			this.loadFromUrl(text);
		} else if (text.indexOf("{")==0) { // old format?
			var json;
			try {
				json = JSON.parse(text)
			} catch(e) {
				return Ext.Msg.show({
					title: this.localize('error'),
					msg: this.localize('cannotLoadJson')+"<br><pre style='color: red'>"+e+"</pre>",
					buttons: Ext.MessageBox.OK,
					icon: Ext.MessageBox.ERROR
				});
			}
			if (!json.metadata || !json.blocks) {
				return Ext.Msg.show({
					title: this.localize('error'),
					msg: this.localize('cannotLoadJsonUnrecognized'),
					buttons: Ext.MessageBox.OK,
					icon: Ext.MessageBox.ERROR
				});
			}
			json.blocks.forEach(function(block) {
        		if (Ext.isString(block) && block!='') {this.addCode({input: block});}
        		else if (block.input) {
            		if (block.type=='text') {this.addText(block);}
            		else {
            			this.addCode(block);
            		}
        		}
			}, this);
		} else if (/^[\w-_]+$/.test(text)) {
			this.loadFromId(text)
		}
		else if (text.indexOf("<")!==0 || text.indexOf("spyral")==-1) {
			return Ext.Msg.show({
				title: this.localize('error'),
				msg: this.localize('cannotLoadUnrecognized'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR
			});
		} else {
			this.loadFromHtmlString(text);
		}
		return true;

    },
    
    loadFromId: function(id) {
    	this.mask(this.localize("loading"));
    	var me = this;
    	Spyral.Load.trombone({
	    	 tool: 'notebook.GitNotebookManager',
	    	 action: 'load',
	    	 id: id,
	    	 noCache: 1
    	}).then(function(json) {
    		me.unmask();
    		me.loadFromString(json.notebook.data); // could be older JSON format
			if (json.notebook.id && json.notebook.id!=me.getNotebookId()) {
				me.setNotebookId(json.notebook.id);
			}
	    	me.setIsEdited(false);
    	}).catch(function(err) {me.unmask()})
    },
    
    loadFromHtmlString: function(html) {
    	var parser = new DOMParser();
    	var dom = parser.parseFromString(html, 'text/html');
    	this.setMetadata(new Spyral.Metadata(dom));
    	var hasDomError = false;
    	dom.querySelectorAll("section.notebook-editor-wrapper").forEach(function(section) {
    		var classes = section.classList;
    		if (classes.contains("notebooktexteditorwrapper")) {
    			var editor = section.querySelector(".notebook-text-editor").innerHTML;
    			this.addText(editor, undefined, section.id);
    		} else if (classes.contains("notebookcodeeditorwrapper")) {
    			var inputEl = section.querySelector(".notebook-code-editor-raw");
    			var typeRe = /\beditor-mode-(\w+)\b/.exec(inputEl.className);
    			var editorType = typeRe[1];
    			
    			/* in an ideal world we could use inputEl.innerHTML to get the contents
    			 * except that since it's in a parsed DOM it's already been transformed
    			 *  significantly. For instance, all >, <, and & character appear in the
    			 * html entities form (which breaks things like && () => {}). You also
    			 * get strange artefacts like if you have "<div>" in your code it may add
    			 * </div> to the end of the innerHTML (to make sure tags are balanced).
    			 * and of course textContent or innerText won't work because that will
    			 * strip any of the HTML formatting out. What's left is to use the parsing
    			 * to ensure the order and to properly grab the IDs and then to do character
    			 * searches on the original string. */
    			var secPos = html.indexOf("<section id='"+section.id+"' class='notebook-editor-wrapper notebookcodeeditorwrapper'>");
				var startPre = html.indexOf("<pre class='notebook-code-editor-raw editor-mode-", secPos);
    			startPre = html.indexOf(">", startPre)+1; // add the length of the string
    			var endPre = html.indexOf("</pre>\n<div class='notebook-code-results", startPre);
    			
    			// check if we have valid values
    			if (secPos===-1 || startPre === -1 || endPre === -1) {
    				hasDomError = true;
    				// this might work, unless the js code includes HTML
    				input = editorType === "javascript" ? inputEl.innerText : inputEl.innerHTML;
    				debugger
    			} else {
        			input = html.substring(startPre, endPre);
    			}
				var autoexec = /\bautoexec\b/.exec(inputEl.className) !== null;
				var output = section.querySelector(".notebook-code-results").innerHTML;
				var expandResults = section.querySelector(".notebook-code-results").classList.contains('collapsed') === false;
				var ui = section.querySelector(".notebook-code-ui");
				if (ui !== null) {
					ui = ui.innerHTML;
				} else {
					ui = undefined;
				}
    			this.addCode({
    				input: input,
					output: output,
					expandResults: expandResults,
					uiHtml: ui,
					mode: editorType,
					autoExecute: autoexec,
    			}, undefined, section.id)
    		}
		}, this);
		
    	if (hasDomError) {
			this.showError(this.localize("errorParsingDomInput"))
    	}
    	
		this.fireEvent('notebookLoaded');
    },
    
    runUntil: function(upToCmp) {
    	var containers = [];
    	Ext.Array.each(this.query("notebookcodeeditorwrapper"), function(item) {
			containers.push(item);
			item.clearResults();
    		if (upToCmp && upToCmp==item) {return false;}
    	}, this);
    	this._run(containers);
    },
    
    runFrom: function(fromCmp) {
    	var containers = [], matched = false;
    	Ext.Array.each(this.query("notebookcodeeditorwrapper"), function(item) {
    		if (fromCmp && fromCmp==item) {matched=true;}
    		if (matched) {
    			containers.push(item);
    			item.clearResults();
    		}
    	}, this);
    	this._run(containers);
    },
    
    runAll: function() {
    	var containers = [];
    	Ext.Array.each(this.query("notebookcodeeditorwrapper"), function(item) {
			containers.push(item);
			item.clearResults();
    	}, this);
    	this._run(containers);
    },
    
    _run: function(containers, prevCode) {
    	if (containers.length>0) {
    		var container = containers.shift();
			if (prevCode === undefined) {
				prevCode = []
			}
    		var result = container.run(true, prevCode);
			prevCode.push(container.getCode());
			if (result!==undefined && result.then && result.catch && result.finally) {
				var me = this;
				result.then(function() {
		        	Ext.defer(me._run, 100, me, [containers, prevCode]);
				})
			} else {
	        	Ext.defer(this._run, 100, this, [containers, prevCode]);
			}
    	}
	},
	
	autoExecuteCells: function() {
		var containers = [];
    	Ext.Array.each(this.query("notebookcodeeditorwrapper"), function(item) {
			if (item.getAutoExecute()) {
				containers.push(item);
			}
		});
		this._run(containers);
	},
    
    loadFromUrl: function(url, run) {
    	var me = this;
    	// load as string and not HTML in case it's an older JSON format
    	Spyral.Load.text(url).then(function(text) {me.loadFromString(text)})
    },
    
    addText: function(block, order, cellId) {
    	return this._add(block, order, 'notebooktexteditorwrapper', cellId);
    },
 
    addCode: function(block, order, cellId, config) {
    	return this._add(block, order, 'notebookcodeeditorwrapper', cellId, {docs: this.spyralTernDocs});
    },
    
    _add: function(block, order, xtype, cellId, config) {
    	if (Ext.isString(block)) {
    		block = {input: block}
    	}
    	var cells = this.getComponent("cells");
		order = (typeof order === 'undefined') ? cells.items.length : order;
		cellId = (typeof cellId === 'undefined') ? Spyral.Util.id() : cellId;
    	return cells.insert(order, Ext.apply(block, {
    		xtype: xtype,
    		order: order,
    		cellId: cellId
    	}, config))
    },
    
    updateMetadata: function() {
    	var metadata = this.getMetadata();
    	this.getComponent("spyralHeader").update(this.getInnerHeaderHtml());
    	this.getComponent("spyralFooter").update(this.getInnerFooterHtml());
    	this.setIsEdited(true);
    },
    
	notebookWrapperMoveUp: function(wrapper) {
		var cells = this.getComponent("cells");
		var i = cells.items.findIndex('id', wrapper.id);
		if (i==0) {
			Ext.Msg.show({
				title: this.localize('error'),
				msg: this.localize('cannotMoveHigher'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.WARNING
			});
		}
		else {
			cells.move(i, i-1);
			this.redoOrder();
		}
	},
	
	notebookWrapperMoveDown: function(wrapper) {
		var cells = this.getComponent("cells");
		var i = cells.items.findIndex('id', wrapper.id);
		if (i==cells.items.getCount()-1) {
			Ext.Msg.show({
				title: this.localize('error'),
				msg: this.localize('cannotMoveLower'),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.WARNING
			});
		}
		else {
			cells.move(i, i+1);
			this.redoOrder();
		}
	},
	
	notebookWrapperRemove: function(wrapper) {
		var cells = this.getComponent("cells");
		cells.remove(wrapper);
		if (cells.items.length==0) {
			this.addText("(Click to edit).")
		}
		this.redoOrder();
	},
	
	notebookWrapperAdd: function(wrapper, e) {
		var cells = this.getComponent("cells");
		var i = cells.items.findIndex('id', wrapper.id);
		var xtype = wrapper.getXType(wrapper);
		var cmp;
		if ((xtype=='notebooktexteditorwrapper' && !e.hasModifier()) || (xtype=='notebookcodeeditorwrapper' && e.hasModifier())) {
			cmp = this.addCode('',i+1);
		}
		else {
			cmp = this.addText('',i+1);
		}
		cmp.getTargetEl().scrollIntoView(this.getTargetEl(), null, true, true);
		this.redoOrder();
	},

    redoOrder: function() {
    	this.query("notebookwrappercounter").forEach(function(counter, i) {
    		counter.setOrder(i);
		})
		this.setIsEdited(true);
    },
    
    setIsEdited: function(val) {
    	// TODO: perhaps setup autosave
    	if (this.getHeader()) {
        	this.getHeader().down("#saveItTool").setDisabled(val==false);
        	if (!val) {
        		this.query("notebookcodeeditor").forEach(function(editor) {
        			editor.setIsChangeRegistered(false);
        		})
        		this.query("notebooktexteditor").forEach(function(editor) {
        			editor.setIsEditRegistered(false);
        		})
        	}
    	}
		this.callParent(arguments);
    },
    
    setNotebookId: function (id) {
    	if (id) {
    		// update URL if needed
    		if (location.pathname.indexOf("/spyral/"+id) === -1) {
    			let url = this.getBaseUrl()+"spyral/"+id+"/";
    			window.history.pushState({
					url: url
				}, '', url);
    		}
    	}
		this.callParent(arguments);
    },

	setMetadata: function(metadata) {
		this.callParent(arguments);
		if (metadata && metadata.title) {
			let title = metadata.title.replace(/<\/?\w+.*?>/g, ''); // remove tags
			document.title = title+' - Spyral';
		}
	},
    
    generateExportHtml: function() {
    	var metadata = this.getMetadata();
        var out = "<!DOCTYPE HTML>\n<html>\n<head>\n\t<meta charset='UTF-8'>\n"+
        	metadata.getHeaders();
        var aceChromeEl = document.getElementById("ace-chrome");
        if (aceChromeEl) {out+=aceChromeEl.outerHTML+"\n"}
        out += document.getElementById("voyant-notebooks-styles").outerHTML+"\n"+
	        "<script> // this script checks to see if embedded tools seem to be available\n"+
	    	"window.addEventListener('load', function() {\n"+
	    		"var hostnames = {}, warned = false;\n"+
	    		"document.querySelectorAll('iframe').forEach(function(iframeEl) {\n"+
	    			"let url = new URL(iframeEl.src);\n"+
	    			"if (!(url.hostname in hostnames) && !warned) {\n"+
	    				"hostnames[url.hostname] = true; // mark as fetched\n"+
	    				"fetch(url).catch(response => {\n"+
	    					"warned = true;\n"+
	    					"alert('This notebook seems to contain one ore more tools that may not be able to load. Possible reasons include a server no longer being accessible (especially if the notebook was generated from a local server), or because of security restrictions.'+url)\n"+
	    				"})\n"+
	    			"}\n"+
	    		"})\n"+
	    	"})\n"+
	    	"</script>\n"+
        	"</head>\n<body class='exported-notebook'>"+
        	this.getHeaderHtml()+
        	"<article class='spyralArticle'>";
		this.getComponent("cells").items.each(function(item, i) {
    		var type = item.isXType('notebookcodeeditorwrapper') ? 'code' : 'text';
    		var content = item.getContent();
    		var counter = item.down("notebookwrappercounter");
			// reminder that the parsing in of notebooks depends on the stability of this syntax
    		out+="<section id='"+counter.name+"' class='notebook-editor-wrapper "+item.xtype+"'>\n"+
    			"<div class='notebookwrappercounter'>"+counter.getTargetEl().dom.innerHTML+"</div>";
    		if (type==='code') {
    			var mode = item.down("notebookcodeeditor").getMode();
				mode = mode.substring(mode.lastIndexOf("/")+1);

				var expandResults = item.getExpandResults();
				
				var autoexec = item.getAutoExecute() ? 'autoexec' : '';
				
				var codeTextLayer = item.getTargetEl().query('.ace_text-layer')[0].cloneNode(true);
				codeTextLayer.style.setProperty('height', 'auto'); // fix for very large height set by ace
				// reminder that the parsing in of notebooks depends on the stability of this syntax
    			out+="<div class='notebook-code-editor ace-chrome'>\n"+codeTextLayer.outerHTML+"\n</div>\n"+
    				"<pre class='notebook-code-editor-raw editor-mode-"+mode+" "+autoexec+"'>"+content.input+"</pre>\n"+
					"<div class='notebook-code-results"+(expandResults ? '' : ' collapsed')+"'>\n"+content.output+"\n</div>\n";
				if (content.ui !== undefined) {
					out += "<div class='notebook-code-ui'>\n"+content.ui+"\n</div>\n";
				}
    		} else {
    			out+="<div class='notebook-text-editor'>"+content+"</div>\n";
    		}
    		out+="</section>\n"
    	})
        out += "</article>\n<footer class='spyral-footer'>"+this.getInnerFooterHtml()+"</footer></body>\n</html>";
    	return out;
    },
    
    getHeaderHtml: function() {
    	return "<header class='spyral-header'>"+this.getInnerHeaderHtml()+"</header>\n";
    },
    
    getInnerHeaderHtml: function() {
    	let html = "";
    	if (this.getMetadata().title) {
        	html += "<div class='title'>"+this.getMetadata().title+"</div>";
    	}
    	if (this.getMetadata().author) {
        	html += "<div class='author'>"+this.getMetadata().author+"</div>";
    	}
    	return html;
    },
    
    getInnerFooterHtml: function() {
    	var text = "", metadata = this.getMetadata();
    	if (metadata.author || metadata.license) {
        	var text = "&copy;";
        	if (metadata.author) {text+=" "+metadata.author;}
        	if (metadata.license) {text+=" ("+metadata.license+")";}
    		text += ". ";
    	}
    	if (metadata.created || metadata.modified) {
    		var created = metadata.shortDate("created"), modified = metadata.shortDate("modified");
    		if (created) {
        		text += this.localize("created")+" "+created+"."
    		}
    		if (modified && created!=modified) {
        		text += this.localize("modified")+" "+modified+"."
    		}
    		
    	}
    	return text;
    },
    
    getExtraExportItems: function() {
    	return [{
       		inputValue: 'html',
       		boxLabel: this.localize('exportHtml')
       	},{
       		inputValue: 'htmlDownload',
       		boxLabel: '<a href="#">'+this.localize('exportHtmlDownload')+'</a>',
       		listeners: {
       			afterrender: function(cmp) {
       		    	var file, name = (this.getNotebookId() || "spyral")+ ".html",
       	    		data = this.generateExportHtml(),
       	    		properties = {type: 'text/html'};
	       	    	try {
	       	    	  file = new File([data], name, properties);
	       	    	} catch (e) {
	       	    	  file = new Blob([data], properties);
	       	    	}
	       	    	
       	    		var url = URL.createObjectURL(file);
       	    		var a = cmp.boxLabelEl.dom.querySelector("a");
       	    		a.setAttribute("download", name);
       	    		a.setAttribute("href", url);
       			},
       			scope: this
       		},
       		handler: function(cmp) {
       			cmp.boxLabelEl.dom.querySelector("a").click();
       			cmp.up("window").close();
       		}
       	}]
    },
    
    exportHtml: function() {
    	var out = this.generateExportHtml();
        var myWindow = window.open();
        myWindow.document.write(out);
        myWindow.document.close();
        myWindow.focus();
    },
	
	// TODO not currently being used
    exportHtmlDownload: function() {
    	// https://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
    	var file,
    		data = this.generateExportHtml(),
    		properties = {type: 'text/plain'}; // Specify the file's mime-type.
    	try {
    	  file = new File([data], "files.txt", properties);
    	} catch (e) {
    	  file = new Blob([data], properties);
    	}
    	var url = URL.createObjectURL(file);
    	this.getApplication().openUrl(url)
    },
    
	getExportUrl: function(asTool) {
		return location.href; // we just provide the current URL
	},

    showMetadataEditor: function() {
		if (this.metadataWindow === undefined) {
			var me = this;

			this.metadataWindow = Ext.create('Ext.window.Window', {
				title: this.localize('metadataEditor'),
				autoScroll: true,
				closeAction: 'hide',
				items: [{
					xtype: 'form',
					items: {
						bodyPadding: 5,
						width: 600,

						// Fields will be arranged vertically, stretched to full width
						layout: 'anchor',
						defaults: {
							anchor: '100%',
							labelAlign: "right"
						},

						// The fields
						defaultType: 'textfield',
						items: [{
							fieldLabel: this.localize("metadataTitle"),
							xtype: 'htmleditor',
							name: 'title',
							height: 100,
							enableAlignments : false,
							enableColors : false,
							enableFont : false,
							enableFontSize : false,
							enableLinks : false,
							enableLists : false
						},{
							fieldLabel: this.localize("metadataAuthor"),
							name: 'author'
						},{
							fieldLabel: this.localize("metadataKeywords"),
							name: 'keywords',
							xtype: 'tagfield',
							store: {
								xtype: 'store.json',
								fields: [
									{name: 'label'},
									{name: 'count', type: 'integer'}
								]
							},
							displayField: 'label',
							valueField: 'label',
							queryMode: 'local',
							filterPickList: true,
							forceSelection: false,
							delimiter: ',',
							createNewOnEnter: true,
							listeners: {
								afterrender: function(cmp) {
									Spyral.Load.trombone({
										tool: 'notebook.CatalogueFacets',
										facets: 'facet.keywords',
										noCache: 1
									}).then(function(json) {
										cmp.getStore().loadRawData(json.catalogue.facets[0].results);
										// need to reset value to make sure previously set keywords show up
										cmp.setValue(cmp.getValue());
									});
								}
							}
						},{
							xtype: 'htmleditor',
							fieldLabel: this.localize("metadataDescription"),
							name: 'description',
							height: 100,
							enableAlignments : false,
							enableColors : false,
							enableFont : false
						},{
							xtype: 'combo',
							fieldLabel: this.localize("metadataLicense"),
							name: 'license',
							store: {
								fields: ['text'],
								data: [
									{"text": "Apache License 2.0"},
									{"text": "BSD 3-Clause \"New\" or \"Revised\" license"},
									{"text": "BSD 2-Clause \"Simplified\" or \"FreeBSD\" license"},
									{"text": "Creative Commons Attribution (CC BY)"},
									{"text": "Creative Commons Attribution-ShareAlike (CC BY-SA)"},
									{"text": "Creative Commons Zero (CC0)"},
									{"text": "GNU General Public License (GPL)"},
									{"text": "GNU Library or \"Lesser\" General Public License (LGPL)"},
									{"text": "MIT license"},
									{"text": "Mozilla Public License 2.0"},
									{"text": "Common Development and Distribution License"},
									{"text": "Eclipse Public License"}
								]
							}
						},{
							xtype: 'combo',
							name: 'language',
							fieldLabel: this.localize("metadataLanguage"),
							store: {
								fields: ['text'],
								data: [
									{"text": "Bengali"},
									{"text": "Bhojpuri"},
									{"text": "Egyptian Arabic"},
									{"text": "English"},
									{"text": "French"},
									{"text": "German"},
									{"text": "Gujarati"},
									{"text": "Hausa"},
									{"text": "Hindi"},
									{"text": "Indonesian"},
									{"text": "Italian"},
									{"text": "Japanese"},
									{"text": "Javanese"},
									{"text": "Kannada"},
									{"text": "Korean"},
									{"text": "Mandarin"},
									{"text": "Marathi"},
									{"text": "Persian"},
									{"text": "Portuguese"},
									{"text": "Russian"},
									{"text": "Southern Min"},
									{"text": "Spanish"},
									{"text": "Standard Arabic"},
									{"text": "Swahili"},
									{"text": "Tamil"},
									{"text": "Telugu"},
									{"text": "Thai"},
									{"text": "Turkish"},
									{"text": "Urdu"},
									{"text": "Vietnamese"},
									{"text": "Western Punjabi"},
									{"text": "Wu Chinese"},
									{"text": "Yue Chinese"}
								]
							}
						}]
						
					}
				}],

				
				// Reset and Submit buttons
				buttons: [{
					text: this.localize('metadataCancel'),
					ui: 'default-toolbar',
					handler: function() {
						this.up('window').close();
					}
				},{
					text: this.localize('metadataReset'),
					ui: 'default-toolbar',
					handler: function() {
						this.up('window').down('form').getForm().reset();
					}
				}, " ", {
					text: this.localize('metadataSave'),
					handler: function() {
						var form = this.up('window').down('form').getForm();
						me.getMetadata().set(form.getValues());
						me.updateMetadata();
						this.up('window').close();
					}
				}]
				
			})
		}

		var metadata = this.getMetadata();
		if (metadata === undefined) {
			metadata = new Spyral.Metadata();
			this.setMetadata(metadata);
		}
		
		var form = this.metadataWindow.down('form').getForm();
		form.findField('title').setValue(metadata.title);
		form.findField('author').setValue(metadata.author);
		form.findField('keywords').setValue(metadata.keywords);
		form.findField('description').setValue(metadata.description);
		form.findField('license').setValue(metadata.license || "Creative Commons Attribution (CC BY)");
		form.findField('language').setValue(metadata.language || "English");

		this.metadataWindow.show();
	}
	
	/*
	showOptionsClick: function(panel) {
		let me = panel;
		if (me.optionsWin === undefined) {
			me.optionsWin = Ext.create('Ext.window.Window', {
				title: me.localize('gearWinTitle'),
    			closeAction: 'hide',
				layout: 'fit',
				width: 400,
				height: 300,
				bodyPadding: 10,
				items: {
				},
    			buttons: [{
    				text: me.localize('ok'),
    				handler: function(button, event) {
    				}
    			},{
    				text: me.localize('cancel'),
    				handler: function(button, event) {
    					button.findParentByType('window').hide();
    				}
    			}]
			});
		}
		me.optionsWin.show();
	}
	*/
});